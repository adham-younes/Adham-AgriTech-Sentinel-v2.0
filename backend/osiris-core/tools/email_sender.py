class EmailSender:
    def send(self, recipient, subject, body):
        print(f"📧 [EMAIL] To: {recipient} | Subject: {subject}")
        return True
