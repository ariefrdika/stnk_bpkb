# Copyright (c) 2024, DAS and contributors
# For license information, please see license.txt
import frappe
from frappe.utils.data import getdate

@frappe.whitelist()
def get_rule_stnk_bpkb(item_code, teritory=None, date=None, is_ignore_rule_bbn='0'):
    data = []    
    if(is_ignore_rule_bbn == '0'):        
        # for row in ["STNK", "BPKB"]:
        for row in ["BBN"]:
            data_query = get_rule_biaya(item_code, row, teritory, date)
            data.extend(data_query)             
            # data.append(get_rule_biaya(item_code, row, teritory, date))
    # else:        
    #     data.append(0)
    
    return data

def get_rule_biaya(item_code, type, teritory=None, date=None):
    rule = frappe.qb.DocType("Rule Biaya BPKB dan STNK")
    date = getdate(date)
    
    query = (
        frappe.qb.from_(rule)
        .select(rule.name, rule.amount, rule.coa, rule.type, rule.vendor)
        .where(
            (rule.item_code == item_code)
            & (rule.disabled == 0)
            & (rule.type == type)
            & (rule.valid_from <= date)
        )
        .orderby(rule.valid_from, order=frappe.qb.desc)
        .limit(1)
    )

    if teritory:
        query = query.where(rule.territory == teritory)
    else:
        query = query.where(rule.territory == None)

    ress = query.run(as_dict=1,debug=0)
    
    # return ress[0] if ress else 0
    return ress