# Copyright (c) 2024, DAS and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils.data import format_date


class RuleBiayaBPKBdanSTNK(Document):
	def validate(self):
		self.cek_active_rule()

	def cek_active_rule(self):
		if self.disabled:
			return

		# cek jika terdapat rule aktif yang sama dalam rentang waktu
		rule = frappe.db.get_value(self.doctype, 
			{"type": self.type, "name": ["!=", self.name], "territory": self.territory, "item_code": self.item_code,
			"valid_from": ["<=", self.valid_to], "valid_to": [">=", self.valid_from],"disabled": 0},
			["name", "valid_from", "valid_to"],
			as_dict=1
		)
		
		if rule:
			frappe.throw("Rule Item {} telah digunakan pada Rule {} dari {} s/d {}".format(
				self.item_code, rule.name, format_date(rule.valid_from, "dd-mm-yyyy"), format_date(rule.valid_to, "dd-mm-yyyy")))
