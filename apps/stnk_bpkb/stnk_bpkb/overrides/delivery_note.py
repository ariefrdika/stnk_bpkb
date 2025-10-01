# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt
import frappe
from erpnext.stock.doctype.delivery_note.delivery_note import DeliveryNote

class DeliveryNote(DeliveryNote):
    # begin: auto-generated types
    # This code is auto-generated. Do not modify anything in this block.

    from typing import TYPE_CHECKING

    if TYPE_CHECKING:
        from erpnext.accounts.doctype.pricing_rule_detail.pricing_rule_detail import PricingRuleDetail
        from erpnext.accounts.doctype.sales_taxes_and_charges.sales_taxes_and_charges import SalesTaxesandCharges
        from erpnext.selling.doctype.sales_team.sales_team import SalesTeam
        from erpnext.stock.doctype.delivery_note_item.delivery_note_item import DeliveryNoteItem
        from erpnext.stock.doctype.packed_item.packed_item import PackedItem
        from frappe.types import DF

        additional_discount_percentage: DF.Float
        address_display: DF.SmallText | None
        amended_from: DF.Link | None
        amount_eligible_for_commission: DF.Currency
        apply_discount_on: DF.Literal["", "Grand Total", "Net Total"]
        auto_repeat: DF.Link | None
        base_discount_amount: DF.Currency
        base_grand_total: DF.Currency
        base_in_words: DF.Data | None
        base_net_total: DF.Currency
        base_rounded_total: DF.Currency
        base_rounding_adjustment: DF.Currency
        base_total: DF.Currency
        base_total_taxes_and_charges: DF.Currency
        campaign: DF.Link | None
        commission_rate: DF.Float
        company: DF.Link
        company_address: DF.Link | None
        company_address_display: DF.SmallText | None
        contact_display: DF.SmallText | None
        contact_email: DF.Data | None
        contact_mobile: DF.SmallText | None
        contact_person: DF.Link | None
        conversion_rate: DF.Float
        cost_center: DF.Link | None
        currency: DF.Link
        customer: DF.Link
        customer_address: DF.Link | None
        customer_group: DF.Link | None
        customer_name: DF.Data | None
        disable_rounded_total: DF.Check
        discount_amount: DF.Currency
        dispatch_address: DF.SmallText | None
        dispatch_address_name: DF.Link | None
        driver: DF.Link | None
        driver_name: DF.Data | None
        excise_page: DF.Data | None
        grand_total: DF.Currency
        group_same_items: DF.Check
        ignore_pricing_rule: DF.Check
        in_words: DF.Data | None
        incoterm: DF.Link | None
        installation_status: DF.Literal[None]
        instructions: DF.Text | None
        inter_company_reference: DF.Link | None
        is_internal_customer: DF.Check
        is_return: DF.Check
        issue_credit_note: DF.Check
        items: DF.Table[DeliveryNoteItem]
        language: DF.Data | None
        letter_head: DF.Link | None
        lr_date: DF.Date | None
        lr_no: DF.Data | None
        named_place: DF.Data | None
        naming_series: DF.Literal["MAT-DN-.YYYY.-", "MAT-DN-RET-.YYYY.-"]
        net_total: DF.Currency
        other_charges_calculation: DF.TextEditor | None
        packed_items: DF.Table[PackedItem]
        per_billed: DF.Percent
        per_installed: DF.Percent
        per_returned: DF.Percent
        pick_list: DF.Link | None
        plc_conversion_rate: DF.Float
        po_date: DF.Date | None
        po_no: DF.SmallText | None
        posting_date: DF.Date
        posting_time: DF.Time
        price_list_currency: DF.Link
        pricing_rules: DF.Table[PricingRuleDetail]
        print_without_amount: DF.Check
        project: DF.Link | None
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
        status: DF.Literal["", "Draft", "To Bill", "Completed", "Return Issued", "Cancelled", "Closed"]
        tax_category: DF.Link | None
        tax_id: DF.Data | None
        taxes: DF.Table[SalesTaxesandCharges]
        taxes_and_charges: DF.Link | None
        tc_name: DF.Link | None
        terms: DF.TextEditor | None
        territory: DF.Link | None
        title: DF.Data | None
        total: DF.Currency
        total_commission: DF.Currency
        total_net_weight: DF.Float
        total_qty: DF.Float
        total_taxes_and_charges: DF.Currency
        transporter: DF.Link | None
        transporter_name: DF.Data | None
        vehicle_no: DF.Data | None
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