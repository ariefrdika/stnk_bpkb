# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.data import cint, flt

from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals, get_round_off_applicable_accounts
from erpnext.accounts.doctype.pricing_rule.utils import get_applied_pricing_rules
from erpnext.stock.get_item_details import _get_item_tax_template

class calculate_taxes_and_totals(calculate_taxes_and_totals):
    def __init__(self, doc: Document):
        self.doc = doc
        frappe.flags.round_off_applicable_accounts = []
        frappe.flags.round_row_wise_tax = frappe.db.get_single_value(
            "Accounts Settings", "round_row_wise_tax"
        )

        self._custom_field = "custom_" if self.doc.doctype not in ["FPK", "SPK"] else ""
        self._discount_field = "discount_amount" if self.doc.doctype not in ["FPK", "SPK"] else "item_discount_amount"

        self._items =  [self.doc] if self.doc.doctype in ["FPK", "SPK"] else self.filter_rows() if self.doc.doctype == "Quotation" else self.doc.get("items")

        get_round_off_applicable_accounts(self.doc.company, frappe.flags.round_off_applicable_accounts)
        self.calculate()

    def calculate(self):
        if not len(self._items):
            return

        self.discount_amount_applied = False
        self._calculate()        

        if self.doc.meta.get_field("discount_amount"):
            self.set_discount_amount()            
            self.apply_discount_amount()
            # frappe.throw(f"{self.doc.total_taxes_and_charges}")
                    
        # Update grand total as per cash and non trade discount
        if self.doc.apply_discount_on == "Grand Total" and self.doc.get("is_cash_or_non_trade_discount"):
            self.doc.grand_total -= self.doc.discount_amount
            self.doc.base_grand_total -= self.doc.base_discount_amount
            self.doc.rounding_adjustment = self.doc.base_rounding_adjustment = 0.0
            self.set_rounded_total()

        self.calculate_shipping_charges()

        if self.doc.doctype in ["Sales Invoice", "Purchase Invoice"]:
            self.calculate_total_advance()

        if self.doc.meta.get_field("other_charges_calculation"):
            self.set_item_wise_tax_breakup()

    def validate_item_tax_template(self):
        for item in self._items:
            if item.get("item_code") and item.get("item_tax_template"):
                item_doc = frappe.get_cached_doc("Item", item.item_code)
                args = {
                    "net_rate": item.net_rate or item.rate,
                    "base_net_rate": item.base_net_rate or item.base_rate,
                    "tax_category": self.doc.get("tax_category"),
                    "posting_date": self.doc.get("posting_date"),
                    "bill_date": self.doc.get("bill_date"),
                    "transaction_date": self.doc.get("transaction_date"),
                    "company": self.doc.get("company"),
                }

                item_group = item_doc.item_group
                item_group_taxes = []

                while item_group:
                    item_group_doc = frappe.get_cached_doc("Item Group", item_group)
                    item_group_taxes += item_group_doc.taxes or []
                    item_group = item_group_doc.parent_item_group

                item_taxes = item_doc.taxes or []

                if not item_group_taxes and (not item_taxes):
                    # No validation if no taxes in item or item group
                    continue

                taxes = _get_item_tax_template(args, item_taxes + item_group_taxes, for_validate=True)

                if taxes:
                    if item.item_tax_template not in taxes:
                        item.item_tax_template = taxes[0]
                        frappe.msgprint(
                            _("Row {0}: Item Tax template updated as per validity and rate applied").format(
                                item.idx, frappe.bold(item.item_code)
                            )
                        )
                        
    def calculate_item_values(self):        
        if self.doc.get("is_consolidated"):
            return

        if not self.discount_amount_applied:            
            for item in self._items:
                self.doc.round_floats_in(item)

                if item.discount_percentage == 100:
                    item.rate = 0.0
                elif item.price_list_rate:
                    if not item.rate or (item.pricing_rules and item.discount_percentage > 0):
                        stnk_bpkb = (item.get(f"{self._custom_field}stnk_rate", 0) + item.get(f"{self._custom_field}bpkb_rate", 0) + item.get(f"{self._custom_field}bbn_rate", 0))
                        item.rate = flt(
                            (item.price_list_rate + stnk_bpkb) * (1.0 - (item.discount_percentage / 100.0)),
                            item.precision("rate"),
                        )

                        item.discount_amount = item.price_list_rate * (item.discount_percentage / 100.0)

                    elif item.discount_amount and item.pricing_rules:
                        item.rate = item.price_list_rate - item.discount_amount

                if item.doctype in [
                    "Quotation Item",
                    "Sales Order Item",
                    "Delivery Note Item",
                    "Sales Invoice Item",
                    "POS Invoice Item",
                    "Purchase Invoice Item",
                    "Purchase Order Item",
                    "Purchase Receipt Item",
                    "FPK", "SPK", "Billing Document Item"
                ]:
                    item.rate_with_margin, item.base_rate_with_margin = self.calculate_margin(item)
                    stnk_bpkb = item.get(f"{self._custom_field}stnk_rate") + item.get(f"{self._custom_field}bpkb_rate") + item.get(f"{self._custom_field}bbn_rate")
                    if flt(item.rate_with_margin) > 0:

                        item.rate = flt(
                            (item.rate_with_margin + stnk_bpkb) * (1.0 - (item.discount_percentage / 100.0)),
                            item.precision("rate"),
                        )

                        if item.get(self._discount_field) and not item.discount_percentage:
                            item.rate = item.rate_with_margin - item.get(self._discount_field)
                        else:
                            item.update({self._discount_field: item.rate_with_margin - item.rate + stnk_bpkb})

                    elif flt(item.price_list_rate) > 0:
                        item.update({self._discount_field : item.price_list_rate - item.rate + stnk_bpkb})
                elif flt(item.price_list_rate) > 0 and not item[self._discount_field]:
                        item.update({self._discount_field : item.price_list_rate - item.rate})

                # CR BARU TAMBAH TABEL ITEM DI FPK SPK
                if frappe.local.site in ['gtm.digitalasiasolusindo.com']:
                    print(f'{item.rate} - {item.get(f"{self._custom_field}stnk_rate", 0)} - {item.get(f"{self._custom_field}bpkb_rate", 0)} - {item.get(f"{self._custom_field}bbn_rate", 0)} + {(item.get("total_additional_items") or 0)}')                    
                    item.net_rate = item.rate - item.get(f"{self._custom_field}stnk_rate", 0) - item.get(f"{self._custom_field}bpkb_rate", 0) - item.get(f"{self._custom_field}bbn_rate", 0) + (item.get("total_additional_items") or 0)
                    print(item.net_rate)
                else:
                    item.net_rate = item.rate - item.get(f"{self._custom_field}stnk_rate") - item.get(f"{self._custom_field}bpkb_rate") - item.get(f"{self._custom_field}bbn_rate")
                    

                if (
                    not item.qty
                    and self.doc.get("is_return")
                    and self.doc.get("doctype") != "Purchase Receipt"
                ):
                    item.amount = flt(-1 * item.rate, item.precision("amount"))
                elif not item.qty and self.doc.get("is_debit_note"):
                    item.amount = flt(item.rate, item.precision("amount"))
                else:
                    item.update({f"{self._custom_field}otr_amount": flt(item.rate * item.qty, item.precision("amount"))})
                    item.amount = flt(item.net_rate * item.qty, item.precision("amount"))

                item.net_amount = item.amount

                self._set_in_company_currency(
                    item, ["price_list_rate", "rate", "net_rate", "amount", "net_amount"]
                )

                item.item_tax_amount = 0.0
                item.update({
                    f"{self._custom_field}stnk_amount": flt(
                        item.get(f"{self._custom_field}stnk_rate") * item.qty, item.precision(f"{self._custom_field}stnk_amount")),
                    f"{self._custom_field}bpkb_amount": flt(
                        item.get(f"{self._custom_field}bpkb_rate") * item.qty, item.precision(f"{self._custom_field}bpkb_amount")),
                    f"{self._custom_field}bbn_amount": flt(
                        item.get(f"{self._custom_field}bbn_rate") * item.qty, item.precision(f"{self._custom_field}bbn_amount")),
                })
    
    def calculate_taxes(self):
        rounding_adjustment_computed = self.doc.get("is_consolidated") and self.doc.get("rounding_adjustment")
        if not rounding_adjustment_computed:
            self.doc.rounding_adjustment = 0

        # maintain actual tax rate based on idx
        actual_tax_dict = dict(
            [
                [tax.idx, flt(tax.tax_amount, tax.precision("tax_amount"))]
                for tax in self.doc.get("taxes")
                if tax.charge_type == "Actual"
            ]
        )

        for n, item in enumerate(self._items):
            item_tax_map = self._load_item_tax_rate(item.item_tax_rate)
            for i, tax in enumerate(self.doc.get("taxes")):
                # tax_amount represents the amount of tax for the current step
                current_tax_amount = self.get_current_tax_amount(item, tax, item_tax_map)
                if frappe.flags.round_row_wise_tax:
                    current_tax_amount = flt(current_tax_amount, tax.precision("tax_amount"))

                # Adjust divisional loss to the last item
                if tax.charge_type == "Actual":
                    actual_tax_dict[tax.idx] -= current_tax_amount
                    if n == len(self._items) - 1:
                        current_tax_amount += actual_tax_dict[tax.idx]

                # accumulate tax amount into tax.tax_amount
                if tax.charge_type != "Actual" and not (
                    self.discount_amount_applied and self.doc.apply_discount_on == "Grand Total"
                ):
                    tax.tax_amount += current_tax_amount

                # store tax_amount for current item as it will be used for
                # charge type = 'On Previous Row Amount'
                tax.tax_amount_for_current_item = current_tax_amount

                # set tax after discount
                tax.tax_amount_after_discount_amount += current_tax_amount

                current_tax_amount = self.get_tax_amount_if_for_valuation_or_deduction(
                    current_tax_amount, tax
                )

                # note: grand_total_for_current_item contains the contribution of
                # item's amount, previously applied tax and the current tax on that item
                if i == 0:
                    tax.grand_total_for_current_item = flt(item.net_amount + current_tax_amount)
                else:
                    tax.grand_total_for_current_item = flt(
                        self.doc.get("taxes")[i - 1].grand_total_for_current_item + current_tax_amount
                    )

                # set precision in the last item iteration
                if n == len(self._items) - 1:
                    self.round_off_totals(tax)
                    self._set_in_company_currency(tax, ["tax_amount", "tax_amount_after_discount_amount"])

                    self.round_off_base_values(tax)
                    self.set_cumulative_total(i, tax)

                    self._set_in_company_currency(tax, ["total"])

                    # adjust Discount Amount loss in last tax iteration
                    if (
                        i == (len(self.doc.get("taxes")) - 1)
                        and self.discount_amount_applied
                        and self.doc.discount_amount
                        and self.doc.apply_discount_on == "Grand Total"
                        and not rounding_adjustment_computed
                    ):
                        added_charge = self.doc.get(f"{self._custom_field}total_stnk") + self.doc.get(f"{self._custom_field}total_bpkb") + self.doc.get(f"{self._custom_field}total_bbn")
                        self.doc.rounding_adjustment = flt(
                            self.doc.grand_total - flt(added_charge) - flt(self.doc.discount_amount) - tax.total,
                            self.doc.precision("rounding_adjustment"),
                        )

    def determine_exclusive_rate(self):
        if not any(cint(tax.included_in_print_rate) for tax in self.doc.get("taxes")):
            return

        for item in self._items:
            item_tax_map = self._load_item_tax_rate(item.item_tax_rate)
            cumulated_tax_fraction = 0
            total_inclusive_tax_amount_per_qty = 0
            for i, tax in enumerate(self.doc.get("taxes")):
                (
                    tax.tax_fraction_for_current_item,
                    inclusive_tax_amount_per_qty,
                ) = self.get_current_tax_fraction(tax, item_tax_map)

                if i == 0:
                    tax.grand_total_fraction_for_current_item = 1 + tax.tax_fraction_for_current_item
                else:
                    tax.grand_total_fraction_for_current_item = (
                        self.doc.get("taxes")[i - 1].grand_total_fraction_for_current_item
                        + tax.tax_fraction_for_current_item
                    )

                cumulated_tax_fraction += tax.tax_fraction_for_current_item
                total_inclusive_tax_amount_per_qty += inclusive_tax_amount_per_qty * flt(item.qty)

            if (
                not self.discount_amount_applied
                and item.qty
                and (cumulated_tax_fraction or total_inclusive_tax_amount_per_qty)
            ):
                amount = flt(item.amount) - total_inclusive_tax_amount_per_qty

                item.net_amount = flt(amount / (1 + cumulated_tax_fraction))
                item.net_rate = flt(item.net_amount / item.qty, item.precision("net_rate"))
                item.discount_percentage = flt(
                    item.discount_percentage, item.precision("discount_percentage")
                )

                self._set_in_company_currency(item, ["net_rate", "net_amount"])
                       
    def calculate_net_total(self):
        self.doc.total_qty = (
            self.doc.total
        ) = self.doc.base_total = (
            self.doc.net_total
        ) = self.doc.base_net_total = 0.0 
        
        self.doc.update({
            f"{self._custom_field}total_stnk": 0,
            f"{self._custom_field}total_bpkb": 0,
            f"{self._custom_field}total_bbn": 0,
        })

        for item in self._items:
            self.doc.total += item.amount
            self.doc.total_qty += item.qty
            self.doc.base_total += item.base_amount
            self.doc.net_total += item.net_amount
            self.doc.base_net_total += item.base_net_amount
            self.doc.update({
                f"{self._custom_field}total_stnk": self.doc.get(f"{self._custom_field}total_stnk") + item.get(f"{self._custom_field}stnk_amount"),
                f"{self._custom_field}total_bpkb": self.doc.get(f"{self._custom_field}total_bpkb") + item.get(f"{self._custom_field}bpkb_amount"),
                f"{self._custom_field}total_bbn": self.doc.get(f"{self._custom_field}total_bbn") + item.get(f"{self._custom_field}bbn_amount"),
            })

        self.doc.round_floats_in(self.doc, [
            "total", "base_total", "net_total", "base_net_total", f"{self._custom_field}total_stnk", f"{self._custom_field}total_bpkb", f"{self._custom_field}total_bbn"])

    def calculate_totals(self):
        stnk_bpkb = flt(self.doc.get(f"{self._custom_field}total_stnk")) + flt(self.doc.get(f"{self._custom_field}total_bpkb")) + flt(self.doc.get(f"{self._custom_field}total_bbn"))

        if self.doc.get("taxes"):
            self.doc.grand_total = flt(self.doc.get("taxes")[-1].total) + flt(self.doc.rounding_adjustment) + stnk_bpkb
        else:
            self.doc.grand_total = flt(self.doc.net_total) + stnk_bpkb

        if self.doc.get("taxes"):
            self.doc.total_taxes_and_charges = flt(
                self.doc.grand_total - self.doc.net_total - flt(self.doc.rounding_adjustment) - stnk_bpkb,
                self.doc.precision("total_taxes_and_charges"),
            )
        else:
            self.doc.total_taxes_and_charges = 0.0

        self._set_in_company_currency(self.doc, ["total_taxes_and_charges", "rounding_adjustment"])

        if self.doc.doctype in [
            "Quotation",
            "Sales Order",
            "Delivery Note",
            "Sales Invoice",
            "POS Invoice",
            "FPK",
            "SPK",
            "Billing Document"
        ]:
            self.doc.base_grand_total = (
                flt(self.doc.grand_total * self.doc.conversion_rate, self.doc.precision("base_grand_total"))
                if self.doc.total_taxes_and_charges
                else self.doc.base_net_total + stnk_bpkb
            )
        else:
            self.doc.taxes_and_charges_added = self.doc.taxes_and_charges_deducted = 0.0
            for tax in self.doc.get("taxes"):
                if tax.category in ["Valuation and Total", "Total"]:
                    if tax.add_deduct_tax == "Add":
                        self.doc.taxes_and_charges_added += flt(tax.tax_amount_after_discount_amount)
                    else:
                        self.doc.taxes_and_charges_deducted += flt(tax.tax_amount_after_discount_amount)

            self.doc.round_floats_in(self.doc, ["taxes_and_charges_added", "taxes_and_charges_deducted"])

            self.doc.base_grand_total = (
                flt(self.doc.grand_total * self.doc.conversion_rate)
                if (self.doc.taxes_and_charges_added or self.doc.taxes_and_charges_deducted)
                else self.doc.base_net_total
            )

            self._set_in_company_currency(self.doc, ["taxes_and_charges_added", "taxes_and_charges_deducted"])

        self.doc.round_floats_in(self.doc, ["grand_total", "base_grand_total"])

        self.set_rounded_total()

    def calculate_total_net_weight(self):
        if self.doc.meta.get_field("total_net_weight"):
            self.doc.total_net_weight = 0.0
            for d in self._items:
                if d.get("total_weight"):
                    self.doc.total_net_weight += d.total_weight

    def apply_discount_amount(self):
        if self.doc.discount_amount:
            if not self.doc.apply_discount_on:
                frappe.throw(_("Please select Apply Discount On"))

            self.doc.base_discount_amount = flt(
                self.doc.discount_amount * self.doc.conversion_rate,
                self.doc.precision("base_discount_amount"),
            )

            if self.doc.apply_discount_on == "Grand Total" and self.doc.get("is_cash_or_non_trade_discount"):
                self.discount_amount_applied = True
                return

            total_for_discount_amount = self.get_total_for_discount_amount()
            taxes = self.doc.get("taxes")
            net_total = 0

            if total_for_discount_amount:
                # calculate item amount after Discount Amount
                for i, item in enumerate(self._items):
                    distributed_amount = (
                        flt(self.doc.discount_amount) * item.net_amount / total_for_discount_amount
                    )                    
                    # frappe.throw(f"flt({self.doc.discount_amount}) * {item.net_amount} / {total_for_discount_amount}")
                    # frappe.throw(f"{item.net_amount} - {distributed_amount}")
                    item.net_amount = flt(item.net_amount - distributed_amount, item.precision("net_amount"))                    
                    net_total += item.net_amount

                    # discount amount rounding loss adjustment if no taxes
                    if (
                        self.doc.apply_discount_on == "Net Total"
                        or not taxes
                        or total_for_discount_amount == self.doc.net_total
                    ) and i == len(self._items) - 1:
                        discount_amount_loss = flt(
                            self.doc.net_total - net_total - self.doc.discount_amount,
                            self.doc.precision("net_total"),
                        )
                        
                        item.net_amount = flt(
                            item.net_amount + discount_amount_loss, item.precision("net_amount")
                        )                       

                    item.net_rate = (
                        flt(item.net_amount / item.qty, item.precision("net_rate")) if item.qty else 0
                    )

                    self._set_in_company_currency(item, ["net_rate", "net_amount"])

                self.discount_amount_applied = True
                self._calculate()
        else:
            self.doc.base_discount_amount = 0

    def get_total_for_discount_amount(self):
        if self.doc.apply_discount_on == "Net Total":
            return self.doc.net_total
        else:
            actual_taxes_dict = {}

            for tax in self.doc.get("taxes"):
                if tax.charge_type in ["Actual", "On Item Quantity"]:
                    tax_amount = self.get_tax_amount_if_for_valuation_or_deduction(tax.tax_amount, tax)
                    actual_taxes_dict.setdefault(tax.idx, tax_amount)
                elif tax.row_id in actual_taxes_dict:
                    actual_tax_amount = flt(actual_taxes_dict.get(tax.row_id, 0)) * flt(tax.rate) / 100
                    actual_taxes_dict.setdefault(tax.idx, actual_tax_amount)
            
            stnk_bpkb = self.doc.get(f"{self._custom_field}total_stnk") + self.doc.get(f"{self._custom_field}total_bpkb") + self.doc.get(f"{self._custom_field}total_bbn")
            # frappe.throw(f"{self.doc.grand_total} - {sum(actual_taxes_dict.values())} - flt({stnk_bpkb})")
            return flt(
                self.doc.grand_total - sum(actual_taxes_dict.values()) - flt(stnk_bpkb), self.doc.precision("grand_total")
            )

    def calculate_margin(self, item):
        rate_with_margin = 0.0
        base_rate_with_margin = 0.0
        if item.price_list_rate:
            if item.pricing_rules and not self.doc.ignore_pricing_rule:
                has_margin = False
                for d in get_applied_pricing_rules(item.pricing_rules):
                    pricing_rule = frappe.get_cached_doc("Pricing Rule", d)

                    if pricing_rule.margin_rate_or_amount and (
                        (
                            pricing_rule.currency == self.doc.currency
                            and pricing_rule.margin_type in ["Amount", "Percentage"]
                        )
                        or pricing_rule.margin_type == "Percentage"
                    ):
                        item.margin_type = pricing_rule.margin_type
                        item.margin_rate_or_amount = pricing_rule.margin_rate_or_amount
                        has_margin = True

                if not has_margin:
                    item.margin_type = None
                    item.margin_rate_or_amount = 0.0

            ofr_rate = item.rate - (item.get(f"{self._custom_field}stnk_rate", 0) + item.get(f"{self._custom_field}bpkb_rate", 0) + item.get(f"{self._custom_field}bbn_rate", 0))

            if not item.pricing_rules and flt(ofr_rate) > flt(item.price_list_rate):
                item.margin_type = "Amount"
                item.margin_rate_or_amount = flt(
                    ofr_rate - item.price_list_rate, item.precision("margin_rate_or_amount")
                )

                rate_with_margin = flt(ofr_rate)
                base_rate_with_margin = flt(rate_with_margin) * flt(self.doc.conversion_rate)

            elif item.margin_type and item.margin_rate_or_amount:
                margin_value = (
                    item.margin_rate_or_amount
                    if item.margin_type == "Amount"
                    else flt(item.price_list_rate) * flt(item.margin_rate_or_amount) / 100
                )
                rate_with_margin = flt(item.price_list_rate) + flt(margin_value)
                base_rate_with_margin = flt(rate_with_margin) * flt(self.doc.conversion_rate)

        return rate_with_margin, base_rate_with_margin
    
    def set_item_wise_tax(self, item, tax, tax_rate, current_tax_amount):
        # store tax breakup for each item
        key = item.get("item_code") or item.get("item_name") or item.get("product")
        item_wise_tax_amount = current_tax_amount * self.doc.conversion_rate
        if frappe.flags.round_row_wise_tax:
            item_wise_tax_amount = flt(item_wise_tax_amount, tax.precision("tax_amount"))
            if tax.item_wise_tax_detail.get(key):
                item_wise_tax_amount += flt(tax.item_wise_tax_detail[key][1], tax.precision("tax_amount"))
            tax.item_wise_tax_detail[key] = [
                tax_rate,
                flt(item_wise_tax_amount, tax.precision("tax_amount")),
            ]
        else:
            if tax.item_wise_tax_detail.get(key):
                item_wise_tax_amount += tax.item_wise_tax_detail[key][1]

            tax.item_wise_tax_detail[key] = [tax_rate, flt(item_wise_tax_amount)]