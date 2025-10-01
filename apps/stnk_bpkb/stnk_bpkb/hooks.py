app_name = "stnk_bpkb"
app_title = "Stnk Bpkb"
app_publisher = "DAS"
app_description = "DAS"
app_email = "das@gmail.com"
app_license = "mit"
# required_apps = []

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_js = "stnk_bpkb.bundle.js"
# app_include_css = "/assets/stnk_bpkb/css/stnk_bpkb.css"

# include js, css files in header of web template
# web_include_css = "/assets/stnk_bpkb/css/stnk_bpkb.css"
# web_include_js = "/assets/stnk_bpkb/js/stnk_bpkb.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "stnk_bpkb/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
doctype_js = {
    "Quotation" : "public/js/quotation.js",
    "Sales Order" : "public/js/sales_order.js",
    "Delivery Note" : "public/js/delivery_note.js",
    "Sales Invoice" : "public/js/sales_invoice.js",
}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "stnk_bpkb/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "stnk_bpkb.utils.jinja_methods",
# 	"filters": "stnk_bpkb.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "stnk_bpkb.install.before_install"
# after_install = "stnk_bpkb.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "stnk_bpkb.uninstall.before_uninstall"
# after_uninstall = "stnk_bpkb.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "stnk_bpkb.utils.before_app_install"
# after_app_install = "stnk_bpkb.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "stnk_bpkb.utils.before_app_uninstall"
# after_app_uninstall = "stnk_bpkb.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "stnk_bpkb.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

override_doctype_class = {
	"Sales Invoice": "stnk_bpkb.overrides.sales_invoice.SalesInvoice",
    "Quotation": "stnk_bpkb.overrides.quotation.Quotation",
	"Sales Order": "stnk_bpkb.overrides.sales_order.SalesOrder",
	"Delivery Note": "stnk_bpkb.overrides.delivery_note.DeliveryNote",
}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"stnk_bpkb.tasks.all"
# 	],
# 	"daily": [
# 		"stnk_bpkb.tasks.daily"
# 	],
# 	"hourly": [
# 		"stnk_bpkb.tasks.hourly"
# 	],
# 	"weekly": [
# 		"stnk_bpkb.tasks.weekly"
# 	],
# 	"monthly": [
# 		"stnk_bpkb.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "stnk_bpkb.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "stnk_bpkb.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "stnk_bpkb.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["stnk_bpkb.utils.before_request"]
# after_request = ["stnk_bpkb.utils.after_request"]

# Job Events
# ----------
# before_job = ["stnk_bpkb.utils.before_job"]
# after_job = ["stnk_bpkb.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"stnk_bpkb.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

