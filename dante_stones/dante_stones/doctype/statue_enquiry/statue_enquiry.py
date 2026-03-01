import frappe
from frappe.model.document import Document
from frappe.utils import today

class StatueEnquiry(Document):

    def before_insert(self):
        if not self.enquiry_date:
            self.enquiry_date = today()

        if not self.status:
            self.status = "New"

    def on_update(self):
        if self.customer and self.status not in ("Won", "Lost"):
            self.db_set("status", "Won", notify=True)

    @frappe.whitelist()
    def convert_to_customer(self):

        if self.customer:
            frappe.throw(f"Already converted - {self.customer}")

        customer_group = (
            frappe.db.get_single_value("Selling Settings", "customer_group")
            or "Individual"
        )

        territory = (
            frappe.db.get_single_value("Selling Settings", "territory")
            or "India"
        )

        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": self.customer_name,
            "customer_type": "Individual",
            "customer_group": customer_group,
            "territory": territory,
            "mobile_no": self.phone,
            "email_id": self.email,
        })

        customer.insert(ignore_permissions=True)

        self.db_set("customer", customer.name)
        self.db_set("status", "Won")

        return customer.name

    @frappe.whitelist()
    def create_quotation(self):

        if not self.customer:
            frappe.throw("Convert to Customer first")

        if self.quotation:
            frappe.throw(f"Quotation already exists: {self.quotation}")

        quotation = frappe.get_doc({
            "doctype": "Quotation",
            "quotation_to": "Customer",
            "party_name": self.customer,
            "transaction_date": today(),
            "items": [{
                "item_name": f"Statue - {self.material or 'Custom'}",
                "description": self.description or self.dimensions or "",
                "qty": 1,
                "uom": "Nos",
                "rate": self.estimated_budget or 0,
            }]
        })

        quotation.insert(ignore_permissions=True)

        self.db_set("quotation", quotation.name)

        return quotation.name