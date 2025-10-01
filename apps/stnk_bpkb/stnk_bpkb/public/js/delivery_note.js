// Copyright (c) 2024, DAS and Contributors
// License: GNU General Public License v3. See license.txt

if(window.location.origin != "https://makamotordev.digitalasiasolusindo.com" && window.location.origin != "https://erp.maka-system.com"){
    stnk_bpkb.sales_common.setup_selling_controller(erpnext.stock.DeliveryNoteController)

    cur_frm.script_manager.make(stnk_bpkb.selling.SellingController);
}