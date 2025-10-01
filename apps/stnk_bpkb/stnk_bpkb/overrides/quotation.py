# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt
import frappe
from erpnext.selling.doctype.quotation.quotation import Quotation

class Quotation(Quotation):
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