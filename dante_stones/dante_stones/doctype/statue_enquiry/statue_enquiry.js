// Copyright (c) 2026, Dante - Balamurugan and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Statue Enquiry", {
// 	refresh(frm) {

// 	},
// });
// Copyright (c) 2026, Dante Stones and contributors
// For license information, please see license.txt

// ─────────────────────────────────────────────────────────────────────────────
// Helpers are defined OUTSIDE frappe.ui.form.on on purpose.
// Putting them inside as keys causes them to be silently registered as event
// names — they're never callable as frm.helperName() that way.
// ─────────────────────────────────────────────────────────────────────────────

const SE_COLOURS = {
	"New":       "blue",
	"Reviewing": "orange",
	"Quoted":    "yellow",
	"Won":       "green",
	"Lost":      "red",
	"On Hold":   "gray"
};

function se_colour(frm) {
	frm.page.set_indicator(
		frm.doc.status || "New",
		SE_COLOURS[frm.doc.status] || "blue"
	);
}

function se_buttons(frm) {
	frm.clear_custom_buttons();

	const s = frm.doc.status;

	// ── Convert to Customer ──────────────────────────────────────────────
	// Show whenever a Customer hasn't been created yet — any status, incl. Won
	if (!frm.doc.customer) {
		frm.add_custom_button(__("Convert to Customer"), () => {
			frappe.confirm(
				`Create a Customer for <b>${frm.doc.customer_name}</b>?`,
				() => frm.call({
					doc: frm.doc,
					method:         "convert_to_customer",
					freeze:         true,
					freeze_message: __("Creating customer…"),
					callback(r) {
						if (!r.exc && r.message) {
							frappe.show_alert({
								message:   `✅ Customer <b>${r.message}</b> created!`,
								indicator: "green"
							}, 6);
							frm.reload_doc();
						}
					}
				})
			);
		}, __("Actions")).addClass("btn-primary");
	}

	// ── Create Quotation ─────────────────────────────────────────────────
	if (frm.doc.customer && !frm.doc.quotation) {
		frm.add_custom_button(__("Create Quotation"), () => {
			frm.call({
				doc: frm.doc,
				method:         "create_quotation",
				freeze:         true,
				freeze_message: __("Creating quotation…"),
				callback(r) {
					if (!r.exc && r.message) {
						frappe.show_alert({
							message:   `📋 Quotation <b>${r.message}</b> created!`,
							indicator: "green"
						}, 6);
						frm.reload_doc();
						// Jump straight to the new Quotation
						frappe.set_route("Form", "Quotation", r.message);
					}
				}
			});
		}, __("Actions"));
	}

	// ── View Quotation ───────────────────────────────────────────────────
	if (frm.doc.quotation) {
		frm.add_custom_button(__("View Quotation"), () =>
			frappe.set_route("Form", "Quotation", frm.doc.quotation)
		);
	}

	// ── View Sales Order ─────────────────────────────────────────────────
	if (frm.doc.sales_order) {
		frm.add_custom_button(__("View Sales Order"), () =>
			frappe.set_route("Form", "Sales Order", frm.doc.sales_order)
		);
	}

	// ── Mark as Lost ─────────────────────────────────────────────────────
	if (!["Lost", "Won"].includes(s) && !frm.is_new()) {
		frm.add_custom_button(__("Mark as Lost"), () => {
			frappe.prompt(
				[{
					fieldname: "reason",
					fieldtype: "Small Text",
					label:     "Reason (optional)"
				}],
				(vals) => {
					frm.set_value("status", "Lost");
					if (vals.reason) {
						const ts  = frappe.datetime.now_datetime();
						const cur = frm.doc.internal_notes || "";
						frm.set_value("internal_notes",
							cur + `\n\n<b>Lost — ${ts}:</b>\n${vals.reason}`
						);
					}
					frm.save();
				},
				__("Mark as Lost"),
				__("Confirm")
			);
		}, __("Actions"));
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────
frappe.ui.form.on("Statue Enquiry", {

	refresh(frm) {
		se_colour(frm);
		se_buttons(frm);
	},

	status(frm) {
		se_colour(frm);
		se_buttons(frm);
	},

	// Rebuild buttons the moment a customer gets linked manually
	customer(frm) {
		se_buttons(frm);
	}

});
