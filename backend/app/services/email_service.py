"""app/services/email_service.py"""

class EmailService:
    @staticmethod
    def send_shortage_alert(admin_email: str, item_code: str, shortage_qty: float, po_number: str):
        # Mocking email to console
        print("="*50)
        print(f"📧 EMAIL SENT TO: {admin_email}")
        print(f"SUBJECT: 🔴 SHORTAGE ALERT: PO {po_number}")
        print(f"BODY: Warning! Item {item_code} has exceeded its allocated quantity by {abs(shortage_qty)} units on PO {po_number}.")
        print("="*50)

    @staticmethod
    def send_surplus_alert(admin_email: str, item_code: str, surplus_qty: float, po_number: str):
        # Mocking email to console
        print("="*50)
        print(f"📧 EMAIL SENT TO: {admin_email}")
        print(f"SUBJECT: 🟡 SURPLUS ALERT: PO {po_number}")
        print(f"BODY: Good news! Item {item_code} has a surplus of {surplus_qty} units on PO {po_number} now that it is completed.")
        print("="*50)
