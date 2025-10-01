# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt
import frappe
# from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice
from gtm.doctype_function.custom_sales_invoice import custom_advance

class SalesInvoice(custom_advance):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from erpnext.accounts.doctype.payment_schedule.payment_schedule import PaymentSchedule
        from erpnext.accounts.doctype.pricing_rule_detail.pricing_rule_detail import PricingRuleDetail
        from erpnext.accounts.doctype.sales_invoice_advance.sales_invoice_advance import SalesInvoiceAdvance
        from erpnext.accounts.doctype.sales_invoice_item.sales_invoice_item import SalesInvoiceItem
        from erpnext.accounts.doctype.sales_invoice_payment.sales_invoice_payment import SalesInvoicePayment
        from erpnext.accounts.doctype.sales_invoice_timesheet.sales_invoice_timesheet import SalesInvoiceTimesheet
        from erpnext.accounts.doctype.sales_taxes_and_charges.sales_taxes_and_charges import SalesTaxesandCharges
        from erpnext.selling.doctype.sales_team.sales_team import SalesTeam
        from erpnext.stock.doctype.packed_item.packed_item import PackedItem
        from frappe.types import DF

        account_for_change_amount: DF.Link | None
        additional_discount_account: DF.Link | None
        additional_discount_percentage: DF.Float
        address_display: DF.SmallText | None
        advances: DF.Table[SalesInvoiceAdvance]
        against_income_account: DF.SmallText | None
        allocate_advances_automatically: DF.Check
        amended_from: DF.Link | None
        amount_eligible_for_commission: DF.Currency
        apply_discount_on: DF.Literal["", "Grand Total", "Net Total"]
        auto_repeat: DF.Link | None
        base_change_amount: DF.Currency
        base_discount_amount: DF.Currency
        base_grand_total: DF.Currency
        base_in_words: DF.SmallText | None
        base_net_total: DF.Currency
        base_paid_amount: DF.Currency
        base_rounded_total: DF.Currency
        base_rounding_adjustment: DF.Currency
        base_total: DF.Currency
        base_total_taxes_and_charges: DF.Currency
        base_write_off_amount: DF.Currency
        campaign: DF.Link | None
        cash_bank_account: DF.Link | None
        change_amount: DF.Currency
        commission_rate: DF.Float
        company: DF.Link
        company_address: DF.Link | None
        company_address_display: DF.SmallText | None
        company_tax_id: DF.Data | None
        contact_display: DF.SmallText | None
        contact_email: DF.Data | None
        contact_mobile: DF.SmallText | None
        contact_person: DF.Link | None
        conversion_rate: DF.Float
        cost_center: DF.Link | None
        currency: DF.Link
        customer: DF.Link | None
        customer_address: DF.Link | None
        customer_group: DF.Link | None
        customer_name: DF.SmallText | None
        debit_to: DF.Link
        disable_rounded_total: DF.Check
        discount_amount: DF.Currency
        dispatch_address: DF.SmallText | None
        dispatch_address_name: DF.Link | None
        due_date: DF.Date | None
        from_date: DF.Date | None
        grand_total: DF.Currency
        group_same_items: DF.Check
        ignore_default_payment_terms_template: DF.Check
        ignore_pricing_rule: DF.Check
        in_words: DF.SmallText | None
        incoterm: DF.Link | None
        inter_company_invoice_reference: DF.Link | None
        is_cash_or_non_trade_discount: DF.Check
        is_consolidated: DF.Check
        is_debit_note: DF.Check
        is_discounted: DF.Check
        is_internal_customer: DF.Check
        is_opening: DF.Literal["No", "Yes"]
        is_pos: DF.Check
        is_return: DF.Check
        items: DF.Table[SalesInvoiceItem]
        language: DF.Data | None
        letter_head: DF.Link | None
        loyalty_amount: DF.Currency
        loyalty_points: DF.Int
        loyalty_program: DF.Link | None
        loyalty_redemption_account: DF.Link | None
        loyalty_redemption_cost_center: DF.Link | None
        named_place: DF.Data | None
        naming_series: DF.Literal["ACC-SINV-.YYYY.-", "ACC-SINV-RET-.YYYY.-"]
        net_total: DF.Currency
        only_include_allocated_payments: DF.Check
        other_charges_calculation: DF.TextEditor | None
        outstanding_amount: DF.Currency
        packed_items: DF.Table[PackedItem]
        paid_amount: DF.Currency
        party_account_currency: DF.Link | None
        payment_schedule: DF.Table[PaymentSchedule]
        payment_terms_template: DF.Link | None
        payments: DF.Table[SalesInvoicePayment]
        plc_conversion_rate: DF.Float
        po_date: DF.Date | None
        po_no: DF.Data | None
        pos_profile: DF.Link | None
        posting_date: DF.Date
        posting_time: DF.Time | None
        price_list_currency: DF.Link
        pricing_rules: DF.Table[PricingRuleDetail]
        project: DF.Link | None
        redeem_loyalty_points: DF.Check
        remarks: DF.SmallText | None
        repost_required: DF.Check
        represents_company: DF.Link | None
        return_against: DF.Link | None
        rounded_total: DF.Currency
        rounding_adjustment: DF.Currency
        sales_partner: DF.Link | None
        sales_team: DF.Table[SalesTeam]
        scan_barcode: DF.Data | None
        select_print_heading: DF.Link | None
        selling_price_list: DF.Link
        set_posting_time: DF.Check
        set_target_warehouse: DF.Link | None
        set_warehouse: DF.Link | None
        shipping_address: DF.SmallText | None
        shipping_address_name: DF.Link | None
        shipping_rule: DF.Link | None
        source: DF.Link | None
        status: DF.Literal["", "Draft", "Return", "Credit Note Issued", "Submitted", "Paid", "Partly Paid", "Unpaid", "Unpaid and Discounted", "Partly Paid and Discounted", "Overdue and Discounted", "Overdue", "Cancelled", "Internal Transfer"]
        subscription: DF.Link | None
        tax_category: DF.Link | None
        tax_id: DF.Data | None
        taxes: DF.Table[SalesTaxesandCharges]
        taxes_and_charges: DF.Link | None
        tc_name: DF.Link | None
        terms: DF.TextEditor | None
        territory: DF.Link | None
        timesheets: DF.Table[SalesInvoiceTimesheet]
        title: DF.Data | None
        to_date: DF.Date | None
        total: DF.Currency
        total_advance: DF.Currency
        total_billing_amount: DF.Currency
        total_billing_hours: DF.Float
        total_commission: DF.Currency
        total_net_weight: DF.Float
        total_qty: DF.Float
        total_taxes_and_charges: DF.Currency
        unrealized_profit_loss_account: DF.Link | None
        update_billed_amount_in_delivery_note: DF.Check
        update_billed_amount_in_sales_order: DF.Check
        update_outstanding_for_self: DF.Check
        update_stock: DF.Check
        use_company_roundoff_cost_center: DF.Check
        write_off_account: DF.Link | None
        write_off_amount: DF.Currency
        write_off_cost_center: DF.Link | None
        write_off_outstanding_amount_automatically: DF.Check
    # end: auto-generated types
    def calculate_taxes_and_totals(self):
        if(frappe.local.site in ['makamotordev.digitalasiasolusindo.com', 'erp.maka-system.com']):
            from erpnext.controllers.taxes_and_totals import calculate_taxes_and_totals
        else:
            from stnk_bpkb.controllers.taxes_and_totals import calculate_taxes_and_totals
        
        calculate_taxes_and_totals(self)

        if self.doctype in (
            "Sales Order",
            "Delivery Note",
            "Sales Invoice",
            "POS Invoice",
        ):
            self.calculate_commission()
            self.calculate_contribution()