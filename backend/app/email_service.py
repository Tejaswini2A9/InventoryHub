import smtplib
from email.message import EmailMessage
from html import escape

from fastapi import HTTPException, status

from .config import settings


def smtp_is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_email(to_email: str, subject: str, text_body: str, html_body: str) -> None:
    if not smtp_is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery is not configured. Add SMTP settings on the server and try again."
        )

    message = EmailMessage()
    message["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Email provider could not deliver the message. Please try again."
        ) from exc


def send_otp_email(to_email: str, code: str) -> bool:
    if not smtp_is_configured():
        print(f"[DEV EMAIL FALLBACK] Verification code for {to_email}: {code}", flush=True)
        return False

    send_email(
        to_email=to_email,
        subject="Your InventoryHub verification code",
        text_body=f"Your InventoryHub verification code is {code}. It expires in 5 minutes.",
        html_body=(
            "<h2>InventoryHub verification</h2>"
            f"<p>Your verification code is <strong>{escape(code)}</strong>.</p>"
            "<p>This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>"
        ),
    )
    return True


def send_order_email(order) -> None:
    item_lines = [
        f"- {item.product.name}: {item.quantity} x ${item.unit_price:.2f} = ${item.quantity * item.unit_price:.2f}"
        for item in order.items
    ]
    item_rows = "".join(
        "<tr>"
        f"<td>{escape(item.product.name)}</td>"
        f"<td>{item.quantity}</td>"
        f"<td>${item.unit_price:.2f}</td>"
        f"<td>${item.quantity * item.unit_price:.2f}</td>"
        "</tr>"
        for item in order.items
    )
    order_number = f"ORD-{order.id:04d}"

    send_email(
        to_email=order.customer.email,
        subject=f"InventoryHub order details #{order_number}",
        text_body=(
            f"Hello {order.customer.name},\n\n"
            f"Here are the requested items for order #{order_number}:\n"
            + "\n".join(item_lines)
            + f"\n\nTotal: ${order.total_amount:.2f}\n"
        ),
        html_body=(
            f"<h2>Order #{order_number}</h2>"
            f"<p>Hello {escape(order.customer.name)}, here are the items you requested:</p>"
            "<table border='1' cellpadding='8' cellspacing='0'>"
            "<thead><tr><th>Item</th><th>Quantity</th><th>Unit price</th><th>Total</th></tr></thead>"
            f"<tbody>{item_rows}</tbody></table>"
            f"<p><strong>Grand total: ${order.total_amount:.2f}</strong></p>"
        ),
    )
