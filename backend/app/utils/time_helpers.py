from datetime import datetime, timezone

def convert_date_to_epoch(date_str: str, date_format: str = "%Y-%m-%d") -> int:
    """Converts a date string into a Unix epoch timestamp (seconds)."""
    try:
        dt = datetime.strptime(date_str, date_format).replace(tzinfo=timezone.utc)
        return int(dt.timestamp())
    except ValueError as e:
        raise ValueError(
            f"Date '{date_str}' does not match format '{date_format}'. Error: {e}"
        )
