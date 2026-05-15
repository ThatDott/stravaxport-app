
# ---------------------------------------------------------------------------
# Philippine Geographical Reference Dataset
# ---------------------------------------------------------------------------
# Used in two places:
#   1. InsightService._build_prompt() - injected into Gemini prompt so Gemini
#      can weave in a Philippine comparison for the user's all-time totals.
#   2. ActivityService.get_geographical_comparisons() - used directly to produce
#      comparison sentences for a single activity's distance and elevation.
#
# To add new references: append entries to the appropriate list below.
# Each entry is a dict with "label" and the metric value.
# ---------------------------------------------------------------------------

DISTANCE_REFERENCES = [
    {"label": "Manila to Tagaytay",             "value_km": 60},
    {"label": "Manila to Batangas",             "value_km": 110},
    {"label": "Manila to Subic",                "value_km": 130},
    {"label": "Manila to Baguio",               "value_km": 250},
    {"label": "Length of Mindanao",             "value_km": 500},
    {"label": "Manila to Iloilo",               "value_km": 520},
    {"label": "Manila to Cebu",                 "value_km": 560},
    {"label": "Length of Luzon",                "value_km": 800},
    {"label": "Manila to Davao",                "value_km": 964},
    {"label": "Full length of the Philippines", "value_km": 1850},
]

ELEVATION_REFERENCES = [
    {"label": "average height of the Chocolate Hills", "value_m": 40},
    {"label": "Mt. Pinatubo",                          "value_m": 1486},
    {"label": "Mt. Mayon",                             "value_m": 2462},
    {"label": "Mt. Kanlaon (highest peak in Visayas)", "value_m": 2465},
    {"label": "Mt. Pulag (highest peak in Luzon)",     "value_m": 2922},
    {"label": "Mt. Apo (highest peak in Philippines)", "value_m": 2954},
]


def build_geo_context() -> str:
    """
    Formats the geographical reference dataset into a prompt-ready string.
    Called by InsightService._build_prompt() and injected into the Gemini prompt
    so Gemini can pick the most fitting comparison for the user's all-time totals.
    """
    distance_lines = "\n".join(
        f"  - {ref['label']}: {ref['value_km']} km"
        for ref in DISTANCE_REFERENCES
    )
    elevation_lines = "\n".join(
        f"  - {ref['label']}: {ref['value_m']} m"
        for ref in ELEVATION_REFERENCES
    )
    return (
        "For geo_comparison, use the most fitting reference from this dataset.\n"
        "Pick whichever produces the most meaningful and natural comparison\n"
        "based on the athlete's total_distance_km or total_elevation_m.\n\n"
        "Distance references (km):\n"
        f"{distance_lines}\n\n"
        "Elevation references (m):\n"
        f"{elevation_lines}"
    )


def get_distance_comparison(distance_km: float) -> str:
    """
    Returns a natural language sentence comparing the given distance to the
    closest Philippine geographical reference.

    Used by ActivityService.get_geographical_comparisons() for single-activity
    comparisons - separate from the Gemini-generated geo_comparison in insights.

    Strategy:
    - Find the reference whose value is closest to the activity distance.
    - If within 85-115% of that reference, say "roughly equal to".
    - Otherwise state the percentage explicitly.
    """
    if not distance_km or distance_km <= 0:
        return ""

    closest = min(DISTANCE_REFERENCES, key=lambda r: abs(r["value_km"] - distance_km))
    percentage = (distance_km / closest["value_km"]) * 100

    if 85 <= percentage <= 115:
        return (
            f"Your {distance_km:.1f}km is roughly the distance from "
            f"{closest['label']} ({closest['value_km']}km)."
        )
    return (
        f"Your {distance_km:.1f}km is about {percentage:.0f}% of the distance from "
        f"{closest['label']} ({closest['value_km']}km)."
    )


def get_elevation_comparison(elevation_m: float) -> str:
    """
    Returns a natural language sentence comparing the given elevation to the
    closest Philippine geographical reference.

    Used by ActivityService.get_geographical_comparisons() for single-activity
    comparisons - separate from the Gemini-generated geo_comparison in insights.

    Strategy:
    - Find the reference whose value is closest to the activity elevation.
    - If within 85-115% of that reference, say "roughly equal to".
    - Otherwise state the percentage explicitly.
    """
    if not elevation_m or elevation_m <= 0:
        return ""

    closest = min(ELEVATION_REFERENCES, key=lambda r: abs(r["value_m"] - elevation_m))
    percentage = (elevation_m / closest["value_m"]) * 100

    if 85 <= percentage <= 115:
        return (
            f"Your {elevation_m:.0f}m elevation gain is roughly the height of "
            f"{closest['label']} ({closest['value_m']}m)."
        )
    return (
        f"Your {elevation_m:.0f}m elevation gain is about {percentage:.0f}% of "
        f"{closest['label']} ({closest['value_m']}m)."
    )
