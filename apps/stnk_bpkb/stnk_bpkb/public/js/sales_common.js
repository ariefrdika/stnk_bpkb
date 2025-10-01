// Copyright (c) 2024, DAS and Contributors
// License: GNU General Public License v3. See license.txt

frappe.provide("stnk_bpkb.selling");

stnk_bpkb.sales_common = {
    setup_selling_controller: function (extend_class) {
        // erpnext.sales_common.setup_selling_controller();

        stnk_bpkb.selling.SellingController = class SellingController extends extend_class {

            setup() {            
                super.setup();
                // jika field yg digunakan merupakan custom field
                this.frm._item_table = !in_list(["FPK", "SPK"], this.frm.doctype) ? "items" : null
                this.frm._custom_field = !in_list(["FPK", "SPK"], this.frm.doctype) ? "custom_" : ""
                this.frm._discount_field = !in_list(["FPK", "SPK"], this.frm.doctype) ? "discount_amount" : "item_discount_amount"
                // var fields = ["rate","warehouse","amount"];

                // var grid = cur_frm.get_field("items").grid;
                // if (grid) grid.set_column_disp(fields, cur_frm.doc.docstatus==0);
            
                if(!in_list(["FPK", "SPK"],this.frm.doctype)){
                    frappe.ui.form.off(this.frm.doctype + " Item", "rate")
                    frappe.ui.form.on(this.frm.doctype + " Item", "rate", function(frm, cdt, cdn) {
                        var item = frappe.get_doc(cdt, cdn);
                        var has_margin_field = frappe.meta.has_field(cdt, 'margin_type');
            
                        frappe.model.round_floats_in(item, ["rate", "price_list_rate"]);
                        
                        if(item.price_list_rate && !item.blanket_order_rate) {
                            var ofr = item.rate - (item[`${frm._custom_field}stnk_rate`] + item[`${frm._custom_field}bpkb_rate`] + item[`${frm._custom_field}bbn_rate`])
                            if(ofr > item.price_list_rate && has_margin_field) {
                                // if rate is greater than price_list_rate, set margin
                                // or set discount
                                item.discount_percentage = 0;
                                item.discount_amount = 0;

                                item.margin_type = 'Amount';
    
                                // tambahkan nilai otr
                                item.margin_rate_or_amount = flt(ofr - item.price_list_rate,
                                    precision("margin_rate_or_amount", item));
                                item.rate_with_margin = ofr;
                            } else {
                                item.discount_percentage = flt((1 - (ofr) / item.price_list_rate) * 100.0,
                                    precision("discount_percentage", item));
                                item.discount_amount = flt(item.price_list_rate) - flt(ofr);
                                item.margin_type = '';
                                item.margin_rate_or_amount = 0;
                                item.rate_with_margin = 0;
                            }
                        } else {
                            item.discount_percentage = 0.0;
                            item.margin_type = '';
                            item.margin_rate_or_amount = 0;
                            item.rate_with_margin = 0;
                        }
                        item.base_rate_with_margin = item.rate_with_margin * flt(frm.doc.conversion_rate);
            
                        cur_frm.cscript.set_gross_profit(item);
                        cur_frm.cscript.calculate_taxes_and_totals();
                        cur_frm.cscript.calculate_stock_uom_rate(frm, cdt, cdn);
                    });
                }else{
                    frappe.ui.form.on(this.frm.doctype, "rate", function(frm) {
                        var has_margin_field = frappe.meta.has_field(frm.doc.doctype, 'margin_type');
            
                        frappe.model.round_floats_in(frm.doc, ["rate", "price_list_rate"]);
            
                        if(frm.doc.price_list_rate) {
                            var ofr = frm.doc.rate - (frm.doc[`${frm._custom_field}stnk_rate`] + frm.doc[`${frm._custom_field}bpkb_rate`] + frm.doc[`${frm._custom_field}bbn_rate`])
                            if(ofr > frm.doc.price_list_rate && has_margin_field) {
                                // if rate is greater than price_list_rate, set margin
                                // or set discount
                                frm.doc.discount_percentage = 0;
                                frm.doc.item_discount_amount = 0;
                                frm.doc.margin_type = 'Amount';
    
                                // tambahkan nilai otr
                                frm.doc.margin_rate_or_amount = flt(ofr - frm.doc.price_list_rate,
                                    precision("margin_rate_or_amount", frm.doc));
                                frm.doc.rate_with_margin = ofr;
                            } else {
                                frm.doc.discount_percentage = flt((1 - (ofr) / frm.doc.price_list_rate) * 100.0,
                                    precision("discount_percentage", frm.doc));
                                frm.doc.item_discount_amount = flt(frm.doc.price_list_rate) - flt(ofr);
                                frm.doc.margin_type = '';
                                frm.doc.margin_rate_or_amount = 0;
                                frm.doc.rate_with_margin = 0;
                            }
                        } else {
                            frm.doc.discount_percentage = 0.0;
                            frm.doc.margin_type = '';
                            frm.doc.margin_rate_or_amount = 0;
                            frm.doc.rate_with_margin = 0;
                        }
                        frm.doc.base_rate_with_margin = frm.doc.rate_with_margin * flt(frm.doc.conversion_rate);
                        
                        cur_frm.cscript.calculate_taxes_and_totals();
                    });
            
                    // frappe.ui.form.on(this.frm.doctype, "biaya_bpkb", function(frm, cdt, cdn) {
                    //     cur_frm.cscript.calculate_taxes_and_totals();
                    // });
            
                    // frappe.ui.form.on(this.frm.doctype, "biaya_stnk", function(frm, cdt, cdn) {
                    //     cur_frm.cscript.calculate_taxes_and_totals();
                    // });
                }
            }

            transaction_date() {                
                super.transaction_date()
                this.reaply_pricing_rule()
            }

            off_the_road_pricing(){
                this.reaply_pricing_rule()
            }

            custom_off_the_road_pricing(doc, cdt, cdn){
                this.item_code(doc, cdt, cdn)
                this.reaply_pricing_rule()
            }

            territory(){
                this.reaply_pricing_rule()
            }

            custom_territory_pemilik(){
                this.reaply_pricing_rule()
            }

            territory_area(){
                this.reaply_pricing_rule()
            }
            
            custom_territory(doc, cdt, cdn){
                this.item_code(doc, cdt, cdn)
                this.reaply_pricing_rule()                
            }

            custom_territory_area(doc, cdt, cdn){
                this.item_code(doc, cdt, cdn)
                this.reaply_pricing_rule()                
            }

            reaply_pricing_rule() {
                // console.log('masuk sini');
                var me = this
                // CR BARU DISINI, LOOP THIS.FRM.ITEMS JIKA FPK SPK NANTI
                var items = in_list(["FPK", "SPK"], this.frm.doctype) ? [this.frm.doc] : this.frm.doc.items;
                $.each(items || [], function(i, item) {
                    if(item.item_code || item.product) me.apply_pricing_rule_on_item(item)
                        me.product(me.frm.doc, me.frm.doc.doctype, me.frm.doc.name)
                })
            }
            
            // posting_date() {
            //     super.posting_date()
            //     var me = this
            //     $.each(this.frm.doc.items || [], function(i, item) {
            //         me.apply_pricing_rule_on_item(item)
            //     })
            // }

            item_code(doc, cdt, cdn) {
                var me = this;
                var item = frappe.get_doc(cdt, cdn);
                var update_stock = 0, show_batch_dialog = 0;
        
                item.weight_per_unit = 0;
                item.weight_uom = '';
                item.conversion_factor = 0;
        
                if(['Sales Invoice', 'Purchase Invoice'].includes(this.frm.doc.doctype)) {
                    update_stock = cint(me.frm.doc.update_stock);
                    show_batch_dialog = update_stock;
        
                } else if((this.frm.doc.doctype === 'Purchase Receipt') ||
                    this.frm.doc.doctype === 'Delivery Note') {
                    show_batch_dialog = 1;
                }
        
                if (show_batch_dialog && item.use_serial_batch_fields === 1) {
                    show_batch_dialog = 0;
                }

                // FLOW UNTUK ARIVAL DOC ITEM
                var is_ard = false
                if(this.frm.doc.doctype === "Arrival Document"){
                    is_ard = true
                }
        
                item.barcode = null;
        
        
                if(item.item_code || item.serial_no) {
                    if(!this.validate_company_and_party()) {
                        this.frm.fields_dict["items"].grid.grid_rows[item.idx - 1].remove();
                    } else {
                        item.pricing_rules = ''
                        return this.frm.call({
                            method: "erpnext.stock.get_item_details.get_item_details",
                            child: item,
                            args: {
                                doc: me.frm.doc,
                                args: {
                                    item_code: item.item_code,
                                    barcode: item.barcode,
                                    serial_no: item.serial_no,
                                    batch_no: item.batch_no,
                                    set_warehouse: me.frm.doc.set_warehouse,
                                    warehouse: item.warehouse,
                                    customer: me.frm.doc.customer || me.frm.doc.party_name,
                                    quotation_to: me.frm.doc.quotation_to,
                                    supplier: me.frm.doc.supplier,
                                    currency: me.frm.doc.currency,
                                    update_stock: update_stock,
                                    conversion_rate: me.frm.doc.conversion_rate,
                                    price_list: me.frm.doc.selling_price_list || me.frm.doc.buying_price_list,
                                    price_list_currency: me.frm.doc.price_list_currency,
                                    plc_conversion_rate: me.frm.doc.plc_conversion_rate,
                                    company: me.frm.doc.company,
                                    order_type: me.frm.doc.order_type,
                                    is_pos: cint(me.frm.doc.is_pos),
                                    is_return: cint(me.frm.doc.is_return),
                                    is_subcontracted: me.frm.doc.is_subcontracted,
                                    ignore_pricing_rule: me.frm.doc.ignore_pricing_rule,
                                    doctype: me.frm.doc.doctype,
                                    name: me.frm.doc.name,
                                    project: item.project || me.frm.doc.project,
                                    qty: item.qty || 1,
                                    net_rate: item.rate,
                                    base_net_rate: item.base_net_rate,
                                    stock_qty: item.stock_qty,
                                    conversion_factor: item.conversion_factor,
                                    weight_per_unit: item.weight_per_unit,
                                    uom: item.uom,
                                    weight_uom: item.weight_uom,
                                    manufacturer: item.manufacturer,
                                    stock_uom: item.stock_uom,
                                    pos_profile: cint(me.frm.doc.is_pos) ? me.frm.doc.pos_profile : '',
                                    cost_center: item.cost_center,
                                    tax_category: me.frm.doc.tax_category,
                                    item_tax_template: item.item_tax_template,
                                    child_doctype: item.doctype,
                                    child_docname: item.name,
                                    is_old_subcontracting_flow: me.frm.doc.is_old_subcontracting_flow,
                                    // teritorry: item.custom_territory
                                    teritorry: item.custom_territory
                                }
                            },
        
                            callback: function(r) {
                                if(!r.exc) {
                                    frappe.run_serially([
                                        // FLOW UNTUK ARIVAL DOC ITEM
                                        () =>{
                                            if(is_ard){
                                                var d = locals[cdt][cdn];

                                                if(d.type_upselling === "Item Fix"){
                                                    d.used_quantity = d.qty                                                    
                                                }else{
                                                    d.used_quantity = 0
                                                }                                                
                                            }
                                        },
                                        () => {
                                            var d = locals[cdt][cdn];
                                            me.add_taxes_from_item_tax_template(d.item_tax_rate);
                                            if (d.free_item_data && d.free_item_data.length > 0) {
                                                me.apply_product_discount(d);
                                            }
                                        },
                                        () => {
                                            // for internal customer instead of pricing rule directly apply valuation rate on item
                                            if ((me.frm.doc.is_internal_customer || me.frm.doc.is_internal_supplier) && me.frm.doc.represents_company === me.frm.doc.company) {
                                                me.get_incoming_rate(item, me.frm.posting_date, me.frm.posting_time,
                                                    me.frm.doc.doctype, me.frm.doc.company);
                                            } else {
                                                me.frm.script_manager.trigger("price_list_rate", cdt, cdn);
                                            }
                                        },
                                        () => {
                                            if (me.frm.doc.is_internal_customer || me.frm.doc.is_internal_supplier) {
                                                me.calculate_taxes_and_totals();
                                            }
                                        },
                                        () => me.toggle_conversion_factor(item),
                                        () => {
                                            if (show_batch_dialog && !frappe.flags.trigger_from_barcode_scanner)
                                                return frappe.db.get_value("Item", item.item_code, ["has_batch_no", "has_serial_no"])
                                                    .then((r) => {
                                                        if (r.message &&
                                                        (r.message.has_batch_no || r.message.has_serial_no)) {
                                                            frappe.flags.hide_serial_batch_dialog = false;
                                                        } else {
                                                            show_batch_dialog = false;
                                                        }
                                                    });
                                        },
                                        () => {
                                            // check if batch serial selector is disabled or not
                                            if (show_batch_dialog && !frappe.flags.hide_serial_batch_dialog)
                                                return frappe.db.get_single_value('Stock Settings', 'disable_serial_no_and_batch_selector')
                                                    .then((value) => {
                                                        if (value) {
                                                            frappe.flags.hide_serial_batch_dialog = true;
                                                        }
                                                    });
                                        },
                                        () => {
                                            if(show_batch_dialog && !frappe.flags.hide_serial_batch_dialog && !frappe.flags.dialog_set) {
                                                var d = locals[cdt][cdn];
                                                $.each(r.message, function(k, v) {
                                                    if(!d[k]) d[k] = v;
                                                });
        
                                                if (d.has_batch_no && d.has_serial_no) {
                                                    d.batch_no = undefined;
                                                }
        
                                                frappe.flags.dialog_set = true;
                                                erpnext.show_serial_batch_selector(me.frm, d, (item) => {
                                                    me.frm.script_manager.trigger('qty', item.doctype, item.name);
                                                    if (!me.frm.doc.set_warehouse)
                                                        me.frm.script_manager.trigger('warehouse', item.doctype, item.name);
                                                    me.apply_price_list(item, true);
                                                }, undefined, !frappe.flags.hide_serial_batch_dialog);
                                            } else {
                                                frappe.flags.dialog_set = false;
                                            }
                                        },
                                        () => me.conversion_factor(doc, cdt, cdn, true),
                                        () => me.remove_pricing_rule(item),
                                        () => {
                                            if (item.apply_rule_on_other_items) {
                                                let key = item.name;
                                                me.apply_rule_on_other_items({key: item});
                                            }
                                        },
                                        () => {
                                            var company_currency = me.get_company_currency();
                                            me.update_item_grid_labels(company_currency);
                                        }
                                    ]);
                                }
                            }
                        });
                    }
                }
            }

            qty(doc, cdt, cdn) {
                if (!this.frm.doc.__onload?.load_after_mapping) {
                    let item = frappe.get_doc(cdt, cdn);
                    // item.pricing_rules = ''
                    frappe.run_serially([
                        () => this.remove_pricing_rule_for_item(item),
                        () => this.conversion_factor(doc, cdt, cdn, true),
                        // () => this.apply_price_list(item, true), //reapply price list before applying pricing rule                                                
                        () => this.calculate_stock_uom_rate(doc, cdt, cdn),
                        () => this.apply_pricing_rule(item, true),                        
                    ]);
                    // this.item_code(doc, cdt, cdn)
                    this.reaply_pricing_rule();                    
                }                
            }

            product(doc, cdt, cdn) {
                var me = this;
                var update_stock = 0, show_batch_dialog = 0;
                
                if(doc.product) {
                    return frappe.call({
                        method: "erpnext.stock.get_item_details.get_item_details",
                        args: {
                            doc: me.frm.doc,
                            args: {
                                item_code: doc.product,
                                warehouse: me.frm.doc.set_warehouse,
                                customer: me.frm.doc.customer || me.frm.doc.party_name,
                                quotation_to: me.frm.doc.quotation_to,
                                supplier: me.frm.doc.supplier,
                                currency: me.frm.doc.currency,
                                update_stock: update_stock,
                                conversion_rate: me.frm.doc.conversion_rate,
                                price_list: me.frm.doc.selling_price_list || me.frm.doc.buying_price_list,
                                price_list_currency: me.frm.doc.price_list_currency,
                                plc_conversion_rate: me.frm.doc.plc_conversion_rate,
                                company: me.frm.doc.company,
                                order_type: me.frm.doc.order_type,
                                is_pos: cint(me.frm.doc.is_pos),
                                is_return: cint(me.frm.doc.is_return),
                                is_subcontracted: me.frm.doc.is_subcontracted,
                                ignore_pricing_rule: me.frm.doc.ignore_pricing_rule,
                                doctype: me.frm.doc.doctype,
                                name: me.frm.doc.name,
                                project: me.frm.doc.project,
                                qty: 1,
                                net_rate: me.frm.doc.rate,
                                base_net_rate: me.frm.doc.base_net_rate,
                                stock_qty: me.frm.doc.stock_qty,
                                conversion_factor: doc.conversion_factor,
                                weight_per_unit: doc.weight_per_unit,
                                uom: me.frm.doc.uom,
                                weight_uom: me.frm.doc.weight_uom,
                                manufacturer: me.frm.doc.manufacturer,
                                stock_uom: me.frm.doc.stock_uom,
                                pos_profile: cint(me.frm.doc.is_pos) ? me.frm.doc.pos_profile : '',
                                cost_center: me.frm.doc.cost_center,
                                tax_category: me.frm.doc.tax_category,
                                item_tax_template: me.frm.doc.item_tax_template,
                                is_old_subcontracting_flow: me.frm.doc.is_old_subcontracting_flow,
                                // teritorry: me.frm.doc.custom_territory_pemilik || me.frm.doc.territory,
                                teritorry: me.frm.doc.territory_area,
                            }
                        },
        
                        callback: function(r) {
                            if(!r.exc) {
                                for (var key in r.message) {
                                    me.frm.doc[key] = r.message[key];
                                }
                                
                                frappe.run_serially([
                                    () => {
                                        me.frm.script_manager.trigger("price_list_rate", cdt, cdn);
                                    },
                                ]);
                            }
                        }
                    });
                }
            }

            update_item_grid_labels(company_currency) {
                this.frm.set_currency_labels([
                    "base_rate", "base_net_rate", "base_price_list_rate",
                    "base_amount", "base_net_amount", "base_rate_with_margin"
                ], company_currency, this.frm._item_table);

                this.frm.set_currency_labels([
                    "rate", "net_rate", "price_list_rate", "amount", `${this.frm._custom_field}otr_amount`,
                    "net_amount", "stock_uom_rate", "rate_with_margin"
                ], this.frm.doc.currency, this.frm._item_table);
            }

            toggle_item_grid_columns(company_currency) {
                const me = this;
                // toggle columns
                this.frm.toggle_display("base_net_total", (show && (me.frm.doc.currency != company_currency)));
                var item_grid = this.frm.fields_dict["items"].grid;
                $.each(["base_rate", "base_price_list_rate", "base_amount", "base_rate_with_margin"], function(i, fname) {
                    if(frappe.meta.get_docfield(item_grid.doctype, fname))
                        item_grid.set_column_disp(fname, me.frm.doc.currency != company_currency);
                        me.frm.toggle_display(fname, me.frm.doc.currency != company_currency);
                });
        
                var show = (cint(cur_frm.doc.discount_amount)) ||
                    ((cur_frm.doc.taxes || []).filter(function(d) {return d.included_in_print_rate===1}).length);
        
                $.each(["net_rate", "net_amount"], function(i, fname) {
                    if(frappe.meta.get_docfield(item_grid.doctype, fname))
                        item_grid.set_column_disp(fname, show);
                        me.frm.toggle_display(fname, me.frm.doc.currency != company_currency);

                });
        
                $.each(["base_net_rate", "base_net_amount"], function(i, fname) {
                    if(frappe.meta.get_docfield(item_grid.doctype, fname))
                        item_grid.set_column_disp(fname, (show && (me.frm.doc.currency != company_currency)));
                        me.frm.toggle_display(fname, me.frm.doc.currency != company_currency);

                });
            }
            
            _set_values_for_item_list(children) {
                const items_rule_dict = {};
        
                for (const child of children) {
                    const existing_pricing_rule = frappe.model.get_value(child.doctype, child.name, "pricing_rules");
        
                    for (const [key, value] of Object.entries(child)) {
                        if (!["doctype", "name"].includes(key)) {
                            // if (key === "price_list_rate") {
                            //     frappe.model.set_value(child.doctype, child.name, "rate", value);
                            // }
        
                            if (key === "pricing_rules") {
                                frappe.model.set_value(child.doctype, child.name, key, value);
                            }
        
                            if (key !== "free_item_data") {
                                if (child.apply_rule_on_other_items && JSON.parse(child.apply_rule_on_other_items).length) {
                                    if (!in_list(JSON.parse(child.apply_rule_on_other_items), child.item_code)) {
                                        continue;
                                    }
                                }
        
                                frappe.model.set_value(child.doctype, child.name, key, value);
                            }
                        }
                    }
        
                    frappe.model.round_floats_in(
                        frappe.get_doc(child.doctype, child.name),
                        ["price_list_rate", "discount_percentage"],
                    );
        
                    // if pricing rule set as blank from an existing value, apply price_list
                    if (!this.frm.doc.ignore_pricing_rule && existing_pricing_rule && !child.pricing_rules) {
                        this.apply_price_list(frappe.get_doc(child.doctype, child.name));
                    } else if (!child.pricing_rules) {
                        this.remove_pricing_rule(frappe.get_doc(child.doctype, child.name));
                    }
        
                    if (child.free_item_data && child.free_item_data.length > 0) {
                        this.apply_product_discount(child);
                    }
        
                    if (child.apply_rule_on_other_items && JSON.parse(child.apply_rule_on_other_items).length) {
                        items_rule_dict[child.name] = child;
                    }
                }
        
                this.apply_rule_on_other_items(items_rule_dict);
                this.calculate_taxes_and_totals();
            }
            
            price_list_rate(doc, cdt, cdn) {
                var item = frappe.get_doc(cdt, cdn);
                frappe.model.round_floats_in(item, ["price_list_rate", "discount_percentage"]);
        
                // check if child doctype is Sales Order Item/Quotation Item and calculate the rate
                if (in_list(["Quotation Item", "Sales Order Item", 
                    "Delivery Note Item", "Sales Invoice Item", "POS Invoice Item", "Purchase Invoice Item", "Purchase Order Item", "Purchase Receipt Item", 
                    "FPK", "SPK", "Arrival Document Item", "Billing Document Item"
                ]), cdt)
                    this.apply_pricing_rule_on_item(item);
                else
                    item.rate = flt(item.price_list_rate * (1 - item.discount_percentage / 100.0),
                        precision("rate", item));
        
                this.calculate_taxes_and_totals();
            }
            
            async apply_pricing_rule_on_item(item) {
                var me = this
                
                let effective_item_rate = item.price_list_rate;
                let item_rate = item.rate;

                if (["Sales Order", "Quotation"].includes(item.parenttype) && item.blanket_order_rate) {
                    effective_item_rate = item.blanket_order_rate;
                }
                
                var territory_field = ""
                var is_ignore_rule_bbn = ""
                var custom_term_portion = 100
                if(["Sales Order", "Quotation", "Delivery Note", "Sales Invoice", "Arrival Document", "Billing Document"].includes(item.parenttype)){
                    territory_field = item.custom_territory_area
                    is_ignore_rule_bbn = item.custom_off_the_road_pricing
                    if(["Sales Invoice"].includes(item.parenttype)){
                        custom_term_portion = item.custom_term_portion || 100
                    }
                    else{
                        custom_term_portion = 100
                    }
                }else{
                    territory_field = this.frm.doc.custom_territory_pemilik || this.frm.doc.territory
                    is_ignore_rule_bbn = this.frm.doc.off_the_road_pricing
                    custom_term_portion = 100
                }

                await frappe.call({
                    method: "stnk_bpkb.controllers.get_items_detail.get_rule_stnk_bpkb",
                    args: {
                        item_code: item.item_code || item.product,
                        teritory: territory_field,
                        date: this.frm.doc.transaction_date || this.frm.doc.posting_date,
                        is_ignore_rule_bbn: is_ignore_rule_bbn,
                    },
                    callback: (r) => {
                        if(!r.exc) {    
                            console.log('hare');
                            if(window.location.hostname == "gtm.digitalasiasolusindo.com"){                                                                              
                                console.log('GTM ONLY');
                            }
                            item[`${me.frm._custom_field}stnk_rate`] = item[`${me.frm._custom_field}bpkb_rate`] = item[`${me.frm._custom_field}bbn_rate`] = 0.0
                            item[`${me.frm._custom_field}stnk_account`] = item[`${me.frm._custom_field}bpkb_account`] = item[`${me.frm._custom_field}bbn_account`] = ""
                            item[`${me.frm._custom_field}vendor`] = item[`${me.frm._custom_field}vendor`] = item[`${me.frm._custom_field}vendor`] = ""
                            $.each(r.message || [], function(i, rule) {
                                if(!rule.amount) return                                 
                                item[`${me.frm._custom_field + rule.type.toLowerCase()}_rate`] = rule.amount * (custom_term_portion/100)
                                item[`${me.frm._custom_field + rule.type.toLowerCase()}_account`] = rule.coa
                                item[`${me.frm._custom_field}vendor`] = rule.vendor
                                effective_item_rate += flt(rule.amount * (custom_term_portion/100))
                            })
                        }
                    }
                })

                if (item.margin_type == "Percentage") {
                    item.rate_with_margin = flt(effective_item_rate)
                        + flt(effective_item_rate) * ( flt(item.margin_rate_or_amount) / 100);
                } else {
                    item.rate_with_margin = flt(effective_item_rate) + flt(item.margin_rate_or_amount);
                }
                item.base_rate_with_margin = flt(item.rate_with_margin) * flt(this.frm.doc.conversion_rate);
                
                
                item_rate = flt(item.rate_with_margin , precision("rate", item));
                if (item.discount_percentage && !item[this.frm._discount_field]) {
                    item[this.frm._discount_field] = flt(item.rate_with_margin) * flt(item.discount_percentage) / 100;
                }
        
                if (item[this.frm._discount_field] > 0) {
                    item_rate = flt((item.rate_with_margin) - (item[this.frm._discount_field]), precision('rate', item));
                    item.discount_percentage = 100 * flt(item[this.frm._discount_field]) / flt(item.rate_with_margin);
                }
                
                if(["Sales Order", "Quotation", "Delivery Note", "Sales Invoice", "Arrival Document", "Billing Document"].includes(item.parenttype)){
                    frappe.model.set_value(item.doctype, item.name, "rate", item_rate);
                }else{
                    frappe.model.set_value(item.doctype, item.name, "rate", effective_item_rate);
                }                
            }

            _calculate_taxes_and_totals() {
                const is_quotation = this.frm.doc.doctype == "Quotation";
                // CR BARU DISINI, LOOP THIS.FRM.ITEMS JIKA FPK SPK NANTI
                this.frm._items = in_list(["FPK", "SPK"] ,this.frm.doctype) ? [this.frm.doc] : is_quotation ? this.filtered_items() : this.frm.doc.items;
                
                this.validate_conversion_rate();
                this.calculate_item_values();
                this.initialize_taxes();
                this.determine_exclusive_rate();
                this.calculate_net_total();
                this.calculate_taxes();
                this.manipulate_grand_total_for_inclusive_tax();
                this.calculate_totals();
                this._cleanup();
            }
            
            calculate_item_values() {
                var me = this;
                if (!this.discount_amount_applied) {
                    // if(this.frm._single_item) return this.single_item_value()
                    for (const item of this.frm._items || []) {
                        frappe.model.round_floats_in(item);
                        // CR BARU
                        if(window.location.hostname == "gtm.digitalasiasolusindo.com"){
                            var total_additional_items_fpk_spk = 0
                            if(["FPK", "SPK"].includes(me.frm.doc.doctype)){
                                total_additional_items_fpk_spk = item.total_additional_items
                            }
                            item.net_rate = item.rate - item[`${this.frm._custom_field}stnk_rate`] - item[`${this.frm._custom_field}bpkb_rate`] - item[`${this.frm._custom_field}bbn_rate`] + total_additional_items_fpk_spk;                            
                            console.log(total_additional_items_fpk_spk, item.net_rate);
                        }else{
                            item.net_rate = item.rate - item[`${this.frm._custom_field}stnk_rate`] - item[`${this.frm._custom_field}bpkb_rate`] - item[`${this.frm._custom_field}bbn_rate`];
                        }
                        item.qty = item.qty === undefined ? (me.frm.doc.is_return ? -1 : 1) : item.qty;
        
                        if (!(me.frm.doc.is_return || me.frm.doc.is_debit_note)) {
                            item[`${this.frm._custom_field}otr_amount`] = flt(item.rate * item.qty, precision(`${this.frm._custom_field}otr_amount`, item));                            
                            item.net_amount = item.amount = flt(item.net_rate * item.qty, precision("amount", item));
                        }
                        else {
                            // allow for '0' qty on Credit/Debit notes
                            let qty = flt(item.qty);
                            if (!qty) {
                                qty = (me.frm.doc.is_debit_note ? 1 : -1);
                                if (me.frm.doc.doctype !== "Purchase Receipt" && me.frm.doc.is_return === 1) {
                                    // In case of Purchase Receipt, qty can be 0 if all items are rejected
                                    qty = flt(item.qty);
                                }
                            }
        
                            item[`${this.frm._custom_field}otr_amount`] = flt(item.rate * qty, precision(`${this.frm._custom_field}otr_amount`, item));
                            item.net_amount = item.amount = flt(item.net_rate * qty, precision("net_amount", item));
                        }
                        
                        item[`${this.frm._custom_field}stnk_amount`] = flt(item[`${this.frm._custom_field}stnk_rate`] * item.qty, precision(`${this.frm._custom_field}stnk_amount`, item));
                        item[`${this.frm._custom_field}bpkb_amount`] = flt(item[`${this.frm._custom_field}bpkb_rate`] * item.qty, precision(`${this.frm._custom_field}bpkb_amount`, item));
                        item[`${this.frm._custom_field}bbn_amount`] = flt(item[`${this.frm._custom_field}bbn_rate`] * item.qty, precision(`${this.frm._custom_field}bbn_amount`, item));
        
                        item.item_tax_amount = 0.0;
                        item.total_weight = flt(item.weight_per_unit * item.stock_qty);
        
                        me.set_in_company_currency(item, ["price_list_rate", "rate", "amount", "net_rate", "net_amount"]);
                    }
                }
            }
            
            initialize_taxes() {
                var me = this;
        
                $.each(this.frm.doc["taxes"] || [], function(i, tax) {
                    if (!tax.dont_recompute_tax) {
                        tax.item_wise_tax_detail = {};
                    }
                    var tax_fields = ["total", "tax_amount_after_discount_amount",
                        "tax_amount_for_current_item", "grand_total_for_current_item",
                        "tax_fraction_for_current_item", "grand_total_fraction_for_current_item"];
        
                    if (cstr(tax.charge_type) != "Actual" &&
                        !(me.discount_amount_applied && me.frm.doc.apply_discount_on=="Grand Total")) {
                        tax_fields.push("tax_amount");
                    }
        
                    $.each(tax_fields, function(i, fieldname) { tax[fieldname] = 0.0; });
        
                    if (!this.discount_amount_applied) {
                        erpnext.accounts.taxes.validate_taxes_and_charges(tax.doctype, tax.name);
                        erpnext.accounts.taxes.validate_inclusive_tax(tax);
                    }
                    frappe.model.round_floats_in(tax);
                });
            }
        
            calculate_taxes() {
                var me = this;
                this.frm.doc.rounding_adjustment = 0;
                var actual_tax_dict = {};		
        
                // maintain actual tax rate based on idx
                $.each(this.frm.doc["taxes"] || [], function(i, tax) {
                    if (tax.charge_type == "Actual") {
                        actual_tax_dict[tax.idx] = flt(tax.tax_amount, precision("tax_amount", tax));
                    }
                });
                
                // if(this.frm._single_item){
                //     var item_tax_map = me._load_item_tax_rate(me.frm.doc.item_tax_rate);
                //     $.each(me.frm.doc["taxes"] || [], function(i, tax) {
                //         // tax_amount represents the amount of tax for the current step
                //         var current_tax_amount = me.get_current_tax_amount(me.frm.doc, tax, item_tax_map);
            
                //         // Adjust divisional loss to the last item
                //         if (tax.charge_type == "Actual") {
                //             actual_tax_dict[tax.idx] -= current_tax_amount;
                //             current_tax_amount += actual_tax_dict[tax.idx];
                //         }
            
                //         // accumulate tax amount into tax.tax_amount
                //         if (tax.charge_type != "Actual" &&
                //             !(me.discount_amount_applied && me.frm.doc.apply_discount_on=="Grand Total")) {
                //             tax.tax_amount += current_tax_amount;
                //         }
            
                //         // store tax_amount for current item as it will be used for
                //         // charge type = 'On Previous Row Amount'
                //         tax.tax_amount_for_current_item = current_tax_amount;
            
                //         // tax amount after discount amount
                //         tax.tax_amount_after_discount_amount += current_tax_amount;
            
                //         // for buying
                //         if(tax.category) {
                //             // if just for valuation, do not add the tax amount in total
                //             // hence, setting it as 0 for further steps
                //             current_tax_amount = (tax.category == "Valuation") ? 0.0 : current_tax_amount;
            
                //             current_tax_amount *= (tax.add_deduct_tax == "Deduct") ? -1.0 : 1.0;
                //         }
            
                //         // note: grand_total_for_current_item contains the contribution of
                //         // item's amount, previously applied tax and the current tax on that item
                //         if(i==0) {
                //             tax.grand_total_for_current_item = flt(me.frm.doc.net_amount + current_tax_amount);
                //         } else {
                //             tax.grand_total_for_current_item =
                //                 flt(me.frm.doc["taxes"][i-1].grand_total_for_current_item + current_tax_amount);
                //         }
            
                //         // set precision in the last item iteration		
                //         me.round_off_totals(tax);
                //         me.set_in_company_currency(tax,
                //             ["tax_amount", "tax_amount_after_discount_amount"]);
            
                //         me.round_off_base_values(tax);
            
                //         // in tax.total, accumulate grand total for each item
                //         me.set_cumulative_total(i, tax);
            
                //         me.set_in_company_currency(tax, ["total"]);
            
                //         // adjust Discount Amount loss in last tax iteration
                //         if ((i == me.frm.doc["taxes"].length - 1) && me.discount_amount_applied
                //             && me.frm.doc.apply_discount_on == "Grand Total" && me.frm.doc.discount_amount) {
                            
                //             var added_charge = flt(me.frm.doc[`${this.frm._custom_field}total_stnk`]) + flt(me.frm.doc[`${this.frm._custom_field}total_bpkb`])
                //             me.frm.doc.rounding_adjustment = flt(me.frm.doc.grand_total - added_charge -
                //                 flt(me.frm.doc.discount_amount) - tax.total, precision("rounding_adjustment"));
                //         }
                        
                //     });
                // }else{
                $.each(this.frm._items || [], function(n, item) {
                    var item_tax_map = me._load_item_tax_rate(item.item_tax_rate);
                    $.each(me.frm.doc["taxes"] || [], function(i, tax) {
                        // tax_amount represents the amount of tax for the current step
                        var current_tax_amount = me.get_current_tax_amount(item, tax, item_tax_map);
                        if (frappe.flags.round_row_wise_tax) {
                            current_tax_amount = flt(current_tax_amount, precision("tax_amount", tax));
                        }
        
                        // Adjust divisional loss to the last item
                        if (tax.charge_type == "Actual") {
                            actual_tax_dict[tax.idx] -= current_tax_amount;
                            if (n == me.frm._items.length - 1) {
                                current_tax_amount += actual_tax_dict[tax.idx];
                            }
                        }
        
                        // accumulate tax amount into tax.tax_amount
                        if (tax.charge_type != "Actual" &&
                            !(me.discount_amount_applied && me.frm.doc.apply_discount_on=="Grand Total")) {
                            tax.tax_amount += current_tax_amount;
                        }
        
                        // store tax_amount for current item as it will be used for
                        // charge type = 'On Previous Row Amount'
                        tax.tax_amount_for_current_item = current_tax_amount;
        
                        // tax amount after discount amount
                        tax.tax_amount_after_discount_amount += current_tax_amount;
        
                        // for buying
                        if(tax.category) {
                            // if just for valuation, do not add the tax amount in total
                            // hence, setting it as 0 for further steps
                            current_tax_amount = (tax.category == "Valuation") ? 0.0 : current_tax_amount;
        
                            current_tax_amount *= (tax.add_deduct_tax == "Deduct") ? -1.0 : 1.0;
                        }
        
                        // note: grand_total_for_current_item contains the contribution of
                        // item's amount, previously applied tax and the current tax on that item
                        if(i==0) {
                            tax.grand_total_for_current_item = flt(item.net_amount + current_tax_amount);
                        } else {
                            tax.grand_total_for_current_item =
                                flt(me.frm.doc["taxes"][i-1].grand_total_for_current_item + current_tax_amount);
                        }
        
                        // set precision in the last item iteration
                        if (n == me.frm._items.length - 1) {
                            me.round_off_totals(tax);
                            me.set_in_company_currency(tax,
                                ["tax_amount", "tax_amount_after_discount_amount"]);
        
                            me.round_off_base_values(tax);
        
                            // in tax.total, accumulate grand total for each item
                            me.set_cumulative_total(i, tax);
        
                            me.set_in_company_currency(tax, ["total"]);
        
                            // adjust Discount Amount loss in last tax iteration
                            if ((i == me.frm.doc["taxes"].length - 1) && me.discount_amount_applied
                                && me.frm.doc.apply_discount_on == "Grand Total" && me.frm.doc.discount_amount) {

                                var added_charge = flt(me.frm.doc[`${me.frm._custom_field}total_stnk`]) + flt(me.frm.doc[`${me.frm._custom_field}total_bpkb`]) + flt(me.frm.doc[`${me.frm._custom_field}total_bbn`]) 
                                me.frm.doc.rounding_adjustment = flt(me.frm.doc.grand_total - added_charge -
                                    flt(me.frm.doc.discount_amount) - tax.total, precision("rounding_adjustment"));
                                    
                                console.log(
                                `${me.frm.doc.grand_total} - ${added_charge} - ${flt(me.frm.doc.discount_amount)} - ${tax.total}`
                                );
                                // console.log(precision("rounding_adjustment"));
                            }
                        }
                    });
                });
                // }
            }
        
            determine_exclusive_rate() {
                var me = this;
        
                var has_inclusive_tax = false;
                $.each(me.frm.doc["taxes"] || [], function(i, row) {
                    if(cint(row.included_in_print_rate)) has_inclusive_tax = true;
                });
                if(has_inclusive_tax==false) return;
                
                $.each(me.frm._items || [], function(n, item) {
                    var item_tax_map = me._load_item_tax_rate(item.item_tax_rate);
                    var cumulated_tax_fraction = 0.0;
                    var total_inclusive_tax_amount_per_qty = 0;
                    $.each(me.frm.doc["taxes"] || [], function(i, tax) {
                        var current_tax_fraction = me.get_current_tax_fraction(tax, item_tax_map);
                        tax.tax_fraction_for_current_item = current_tax_fraction[0];
                        var inclusive_tax_amount_per_qty = current_tax_fraction[1];
        
                        if(i==0) {
                            tax.grand_total_fraction_for_current_item = 1 + tax.tax_fraction_for_current_item;
                        } else {
                            tax.grand_total_fraction_for_current_item =
                                me.frm.doc["taxes"][i-1].grand_total_fraction_for_current_item +
                                tax.tax_fraction_for_current_item;
                        }
        
                        cumulated_tax_fraction += tax.tax_fraction_for_current_item;
                        total_inclusive_tax_amount_per_qty += inclusive_tax_amount_per_qty * flt(item.qty);
                    });
        
                    if(!me.discount_amount_applied && item.qty && (total_inclusive_tax_amount_per_qty || cumulated_tax_fraction)) {
                        var amount = flt(item.amount) - total_inclusive_tax_amount_per_qty;
                        item.net_amount = flt(amount / (1 + cumulated_tax_fraction));
                        item.net_rate = item.qty ? flt(item.net_amount / item.qty, precision("net_rate", item)) : 0;
        
                        me.set_in_company_currency(item, ["net_rate", "net_amount"]);
                    }
                });

                // var item_tax_map = me._load_item_tax_rate(me.frm.doc.item_tax_rate);
                // var cumulated_tax_fraction = 0.0;
                // var total_inclusive_tax_amount_per_qty = 0;
                // $.each(me.frm.doc["taxes"] || [], function(i, tax) {
                //     var current_tax_fraction = me.get_current_tax_fraction(tax, item_tax_map);
                //     tax.tax_fraction_for_current_item = current_tax_fraction[0];
                //     var inclusive_tax_amount_per_qty = current_tax_fraction[1];
        
                //     if(i==0) {
                //         tax.grand_total_fraction_for_current_item = 1 + tax.tax_fraction_for_current_item;
                //     } else {
                //         tax.grand_total_fraction_for_current_item =
                //             me.frm.doc["taxes"][i-1].grand_total_fraction_for_current_item +
                //             tax.tax_fraction_for_current_item;
                //     }
        
                //     cumulated_tax_fraction += tax.tax_fraction_for_current_item;
                //     total_inclusive_tax_amount_per_qty += inclusive_tax_amount_per_qty * flt(me.frm.doc.qty);
                // });
        
                // if(!me.discount_amount_applied && me.frm.doc.qty && (total_inclusive_tax_amount_per_qty || cumulated_tax_fraction)) {
                //     var amount = flt(me.frm.doc.amount) - total_inclusive_tax_amount_per_qty;
                //     me.frm.doc.net_amount = flt(amount / (1 + cumulated_tax_fraction));
                //     me.frm.doc.net_rate = me.frm.doc.qty ? flt(me.frm.doc.net_amount / me.frm.doc.qty, precision("net_rate", me.frm.doc)) : 0;
        
                //     me.set_in_company_currency(me.frm.doc, ["net_rate", "net_amount"]);
                // }
            }
        
            apply_discount_amount() {
                var me = this;
                var distributed_amount = 0.0;
                this.frm.doc.base_discount_amount = 0.0;
        
                if (this.frm.doc.discount_amount) {
                    if(!this.frm.doc.apply_discount_on)
                        frappe.throw(__("Please select Apply Discount On"));
        
                    this.frm.doc.base_discount_amount = flt(this.frm.doc.discount_amount * this.frm.doc.conversion_rate,
                        precision("base_discount_amount"));
        
                    if (this.frm.doc.apply_discount_on == "Grand Total" && this.frm.doc.is_cash_or_non_trade_discount) {
                        return;
                    }
        
                    var total_for_discount_amount = this.get_total_for_discount_amount();
                    var net_total = 0;
                    // calculate item amount after Discount Amount
                    if (total_for_discount_amount) {
                        $.each(this.frm._items || [], function(i, item) {
                            distributed_amount = flt(me.frm.doc.discount_amount) * item.net_amount / total_for_discount_amount;
                            item.net_amount = flt(item.net_amount - distributed_amount,
                                precision("base_amount", item));
                            net_total += item.net_amount;
        
                            // discount amount rounding loss adjustment if no taxes
                            if ((!(me.frm.doc.taxes || []).length || total_for_discount_amount==me.frm.doc.net_total || (me.frm.doc.apply_discount_on == "Net Total"))
                                    && i == (me.frm._items || []).length - 1) {
                                var discount_amount_loss = flt(me.frm.doc.net_total - net_total
                                    - me.frm.doc.discount_amount, precision("net_total"));
                                item.net_amount = flt(item.net_amount + discount_amount_loss,
                                    precision("net_amount", item));
                            }
                            item.net_rate = item.qty ? flt(item.net_amount / item.qty, precision("net_rate", item)) : 0;
                            me.set_in_company_currency(item, ["net_rate", "net_amount"]);
                        });

                        // distributed_amount = flt(me.frm.doc.discount_amount) * me.frm.doc.net_amount / total_for_discount_amount;
                        // me.frm.doc.net_amount = flt(me.frm.doc.net_amount - distributed_amount,
                        //     precision("base_amount", me.frm.doc));
                        // net_total += me.frm.doc.net_amount;
                        // // discount amount rounding loss adjustment if no taxes
                        // if ((!(me.frm.doc.taxes || []).length || total_for_discount_amount==me.frm.doc.net_total || (me.frm.doc.apply_discount_on == "Net Total"))) {
                        //     var discount_amount_loss = flt(me.frm.doc.net_total - net_total
                        //         - me.frm.doc.discount_amount, precision("net_total"));
                        //     me.frm.doc.net_amount = flt(me.frm.doc.net_amount + discount_amount_loss,
                        //         precision("net_amount", me.frm.doc));
                        // }
        
                        // me.frm.doc.net_rate = me.frm.doc.qty ? flt(me.frm.doc.net_amount / me.frm.doc.qty, precision("net_rate", me.frm.doc)) : 0;
                        //     me.set_in_company_currency(me.frm.doc, ["net_rate", "net_amount"]);
        
                        this.discount_amount_applied = true;
                        this._calculate_taxes_and_totals();
                    }
                }
            }
        
            get_total_for_discount_amount() {
                if(this.frm.doc.apply_discount_on == "Net Total") {
                    return this.frm.doc.net_total;
                } else {
                    var total_actual_tax = 0.0;
                    var actual_taxes_dict = {};
        
                    $.each(this.frm.doc["taxes"] || [], function(i, tax) {
                        if (["Actual", "On Item Quantity"].includes(tax.charge_type)) {
                            var tax_amount = (tax.category == "Valuation") ? 0.0 : tax.tax_amount;
                            tax_amount *= (tax.add_deduct_tax == "Deduct") ? -1.0 : 1.0;
                            actual_taxes_dict[tax.idx] = tax_amount;
                        } else if (actual_taxes_dict[tax.row_id] !== null) {
                            var actual_tax_amount = flt(actual_taxes_dict[tax.row_id]) * flt(tax.rate) / 100;
                            actual_taxes_dict[tax.idx] = actual_tax_amount;
                        }
                    });
        
                    $.each(actual_taxes_dict, function(key, value) {
                        if (value) total_actual_tax += value;
                    });
                    
                    total_actual_tax += flt(this.frm.doc[`${this.frm._custom_field}total_stnk`]) + flt(this.frm.doc[`${this.frm._custom_field}total_bpkb`]) + flt(this.frm.doc[`${this.frm._custom_field}total_bbn`])
                    return flt(this.frm.doc.grand_total - total_actual_tax, precision("grand_total"));
                }
            }
        
            calculate_net_total() {
                var me = this;
                this.frm.doc.total_qty = this.frm.doc.total = this.frm.doc.base_total = this.frm.doc.net_total = this.frm.doc.base_net_total =
                this.frm.doc[`${this.frm._custom_field}total_stnk`] = this.frm.doc[`${this.frm._custom_field}total_bpkb`] = this.frm.doc[`${this.frm._custom_field}total_bbn`] = 0.0;
                
                $.each(this.frm._items || [], function(i, item) {
                    me.frm.doc[`${me.frm._custom_field}total_stnk`] += item[`${me.frm._custom_field}stnk_amount`];
                    me.frm.doc[`${me.frm._custom_field}total_bpkb`] += item[`${me.frm._custom_field}bpkb_amount`]
                    me.frm.doc[`${me.frm._custom_field}total_bbn`] += item[`${me.frm._custom_field}bbn_amount`]
                    me.frm.doc.total += item.amount;
                    me.frm.doc.total_qty += item.qty;
                    me.frm.doc.base_total += item.base_amount;
                    me.frm.doc.net_total += item.net_amount;
                    me.frm.doc.base_net_total += item.base_net_amount;
                });
            }
        
            
            calculate_totals() {
                // Changing sequence can because of rounding adjustment issue and on-screen discrepancy
                var me = this;
                var tax_count = this.frm.doc["taxes"] ? this.frm.doc["taxes"].length : 0;
                var stnk_bpkb = flt(me.frm.doc[`${this.frm._custom_field}total_stnk`]) + flt(me.frm.doc[`${this.frm._custom_field}total_bpkb`]) + flt(me.frm.doc[`${this.frm._custom_field}total_bbn`])
                this.frm.doc.grand_total = flt(tax_count
                    ? this.frm.doc["taxes"][tax_count - 1].total + flt(this.frm.doc.rounding_adjustment)
                    : this.frm.doc.net_total) + stnk_bpkb;
                
                if(in_list(["Quotation", "Sales Order", "Delivery Note", "Sales Invoice", "Arrival Document", "POS Invoice", "SPK", "FPK", "Billing Document"], this.frm.doc.doctype)) {
                    this.frm.doc.base_grand_total = (this.frm.doc.total_taxes_and_charges) ?
                        flt(this.frm.doc.grand_total * this.frm.doc.conversion_rate) : (this.frm.doc.base_net_total + stnk_bpkb);
                } else {
                    // other charges added/deducted
                    this.frm.doc.taxes_and_charges_added = this.frm.doc.taxes_and_charges_deducted = 0.0;
                    if(tax_count) {
                        $.each(this.frm.doc["taxes"] || [], function(i, tax) {
                            if (in_list(["Valuation and Total", "Total"], tax.category)) {
                                if(tax.add_deduct_tax == "Add") {
                                    me.frm.doc.taxes_and_charges_added += flt(tax.tax_amount_after_discount_amount);
                                } else {
                                    me.frm.doc.taxes_and_charges_deducted += flt(tax.tax_amount_after_discount_amount);
                                }
                            }
                        });

                        frappe.model.round_floats_in(this.frm.doc,
                            ["taxes_and_charges_added", "taxes_and_charges_deducted"]);
                    }

                    this.frm.doc.base_grand_total = flt((this.frm.doc.taxes_and_charges_added || this.frm.doc.taxes_and_charges_deducted) ?
                        flt(this.frm.doc.grand_total * this.frm.doc.conversion_rate) : this.frm.doc.base_net_total);

                    this.set_in_company_currency(this.frm.doc,
                        ["taxes_and_charges_added", "taxes_and_charges_deducted"]);
                }

                this.frm.doc.total_taxes_and_charges = flt(this.frm.doc.grand_total - this.frm.doc.net_total - stnk_bpkb
                    - flt(this.frm.doc.rounding_adjustment), precision("total_taxes_and_charges"));

                this.set_in_company_currency(this.frm.doc, ["total_taxes_and_charges", "rounding_adjustment"]);

                // Round grand total as per precision
                frappe.model.round_floats_in(this.frm.doc, ["grand_total", "base_grand_total"]);

                // rounded totals
                this.set_rounded_total();
            }
        }
    }
}