// Copyright (c) 2024, DAS and contributors
// For license information, please see license.txt

frappe.ui.form.on("Rule Biaya BPKB dan STNK", {
	refresh(frm) {
        frm.set_query("territory", function() {
            return {
                "filters": {
                    "parent_territory": ["=","BBN"]
                }
            };
        });
	},
});
