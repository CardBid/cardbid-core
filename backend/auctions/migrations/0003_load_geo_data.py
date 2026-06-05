from django.db import migrations
from decimal import Decimal

COUNTRY_DATA = [
    # EUROPE
    {"name": "Poland", "code": "PL", "has_states": False, "default_vat": Decimal("0.23"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "United Kingdom", "code": "GB", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.02"), "states": []},
    {"name": "Albania", "code": "AL", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Andorra", "code": "AD", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Armenia", "code": "AM", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Austria", "code": "AT", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Azerbaijan", "code": "AZ", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Belarus", "code": "BY", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Belgium", "code": "BE", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Bosnia and Herzegovina", "code": "BA", "has_states": False, "default_vat": Decimal("0.17"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Bulgaria", "code": "BG", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Croatia", "code": "HR", "has_states": False, "default_vat": Decimal("0.25"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Cyprus", "code": "CY", "has_states": False, "default_vat": Decimal("0.19"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Czechia", "code": "CZ", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Denmark", "code": "DK", "has_states": False, "default_vat": Decimal("0.25"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Estonia", "code": "EE", "has_states": False, "default_vat": Decimal("0.22"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Finland", "code": "FI", "has_states": False, "default_vat": Decimal("0.26"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "France", "code": "FR", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Georgia", "code": "GE", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Germany", "code": "DE", "has_states": False, "default_vat": Decimal("0.19"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Greece", "code": "GR", "has_states": False, "default_vat": Decimal("0.24"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Hungary", "code": "HU", "has_states": False, "default_vat": Decimal("0.27"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Iceland", "code": "IS", "has_states": False, "default_vat": Decimal("0.24"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Ireland", "code": "IE", "has_states": False, "default_vat": Decimal("0.23"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Italy", "code": "IT", "has_states": False, "default_vat": Decimal("0.22"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Kosovo", "code": "XK", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Latvia", "code": "LV", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Liechtenstein", "code": "LI", "has_states": False, "default_vat": Decimal("0.08"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Lithuania", "code": "LT", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Luxembourg", "code": "LU", "has_states": False, "default_vat": Decimal("0.17"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Malta", "code": "MT", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Moldova", "code": "MD", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Monaco", "code": "MC", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Montenegro", "code": "ME", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Netherlands", "code": "NL", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "North Macedonia", "code": "MK", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Norway", "code": "NO", "has_states": False, "default_vat": Decimal("0.25"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Portugal", "code": "PT", "has_states": False, "default_vat": Decimal("0.23"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Romania", "code": "RO", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "San Marino", "code": "SM", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Serbia", "code": "RS", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Slovakia", "code": "SK", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Slovenia", "code": "SI", "has_states": False, "default_vat": Decimal("0.22"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Spain", "code": "ES", "has_states": False, "default_vat": Decimal("0.21"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Sweden", "code": "SE", "has_states": False, "default_vat": Decimal("0.25"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Switzerland", "code": "CH", "has_states": False, "default_vat": Decimal("0.08"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Ukraine", "code": "UA", "has_states": False, "default_vat": Decimal("0.20"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Vatican City", "code": "VA", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},

    # USA
    {
        "name": "USA",
        "code": "US",
        "has_states": True,
        "default_vat": Decimal("0.00"),
        "states": [
            {"name": "Alabama", "code": "AL", "tax_rate": Decimal("0.04")},
            {"name": "Alaska", "code": "AK", "tax_rate": Decimal("0.00")},
            {"name": "Arizona", "code": "AZ", "tax_rate": Decimal("0.06")},
            {"name": "Arkansas", "code": "AR", "tax_rate": Decimal("0.07")},
            {"name": "California", "code": "CA", "tax_rate": Decimal("0.07")},
            {"name": "Colorado", "code": "CO", "tax_rate": Decimal("0.03")},
            {"name": "Connecticut", "code": "CT", "tax_rate": Decimal("0.06")},
            {"name": "Delaware", "code": "DE", "tax_rate": Decimal("0.00")},
            {"name": "Florida", "code": "FL", "tax_rate": Decimal("0.06")},
            {"name": "Georgia", "code": "GA", "tax_rate": Decimal("0.04")},
            {"name": "Hawaii", "code": "HI", "tax_rate": Decimal("0.04")},
            {"name": "Idaho", "code": "ID", "tax_rate": Decimal("0.06")},
            {"name": "Illinois", "code": "IL", "tax_rate": Decimal("0.06")},
            {"name": "Indiana", "code": "IN", "tax_rate": Decimal("0.07")},
            {"name": "Iowa", "code": "IA", "tax_rate": Decimal("0.06")},
            {"name": "Kansas", "code": "KS", "tax_rate": Decimal("0.07")},
            {"name": "Kentucky", "code": "KY", "tax_rate": Decimal("0.06")},
            {"name": "Louisiana", "code": "LA", "tax_rate": Decimal("0.05")},
            {"name": "Maine", "code": "ME", "tax_rate": Decimal("0.06")},
            {"name": "Maryland", "code": "MD", "tax_rate": Decimal("0.06")},
            {"name": "Massachusetts", "code": "MA", "tax_rate": Decimal("0.06")},
            {"name": "Michigan", "code": "MI", "tax_rate": Decimal("0.06")},
            {"name": "Minnesota", "code": "MN", "tax_rate": Decimal("0.07")},
            {"name": "Mississippi", "code": "MS", "tax_rate": Decimal("0.07")},
            {"name": "Missouri", "code": "MO", "tax_rate": Decimal("0.04")},
            {"name": "Montana", "code": "MT", "tax_rate": Decimal("0.00")},
            {"name": "Nebraska", "code": "NE", "tax_rate": Decimal("0.06")},
            {"name": "Nevada", "code": "NV", "tax_rate": Decimal("0.07")},
            {"name": "New Hampshire", "code": "NH", "tax_rate": Decimal("0.00")},
            {"name": "New Jersey", "code": "NJ", "tax_rate": Decimal("0.07")},
            {"name": "New Mexico", "code": "NM", "tax_rate": Decimal("0.05")},
            {"name": "New York", "code": "NY", "tax_rate": Decimal("0.04")},
            {"name": "North Carolina", "code": "NC", "tax_rate": Decimal("0.05")},
            {"name": "North Dakota", "code": "ND", "tax_rate": Decimal("0.05")},
            {"name": "Ohio", "code": "OH", "tax_rate": Decimal("0.06")},
            {"name": "Oklahoma", "code": "OK", "tax_rate": Decimal("0.05")},
            {"name": "Oregon", "code": "OR", "tax_rate": Decimal("0.00")},
            {"name": "Pennsylvania", "code": "PA", "tax_rate": Decimal("0.06")},
            {"name": "Rhode Island", "code": "RI", "tax_rate": Decimal("0.07")},
            {"name": "South Carolina", "code": "SC", "tax_rate": Decimal("0.06")},
            {"name": "South Dakota", "code": "SD", "tax_rate": Decimal("0.05")},
            {"name": "Tennessee", "code": "TN", "tax_rate": Decimal("0.07")},
            {"name": "Texas", "code": "TX", "tax_rate": Decimal("0.06")},
            {"name": "Utah", "code": "UT", "tax_rate": Decimal("0.05")},
            {"name": "Vermont", "code": "VT", "tax_rate": Decimal("0.06")},
            {"name": "Virginia", "code": "VA", "tax_rate": Decimal("0.04")},
            {"name": "Washington", "code": "WA", "tax_rate": Decimal("0.07")},
            {"name": "West Virginia", "code": "WV", "tax_rate": Decimal("0.06")},
            {"name": "Wisconsin", "code": "WI", "tax_rate": Decimal("0.05")},
            {"name": "Wyoming", "code": "WY", "tax_rate": Decimal("0.04")},
            {"name": "District of Columbia", "code": "DC", "tax_rate": Decimal("0.06")},
        ],
    },

    # ASIA
    {"name": "Bahrain", "code": "BH", "has_states": False, "default_vat": Decimal("0.10"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Bangladesh", "code": "BD", "has_states": False, "default_vat": Decimal("0.15"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "China", "code": "CN", "has_states": False, "default_vat": Decimal("0.13"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Hong Kong", "code": "HK", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "India", "code": "IN", "has_states": False, "default_vat": Decimal("0.18"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Indonesia", "code": "ID", "has_states": False, "default_vat": Decimal("0.12"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Japan", "code": "JP", "has_states": False, "default_vat": Decimal("0.10"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Jordan", "code": "JO", "has_states": False, "default_vat": Decimal("0.16"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Kazakhstan", "code": "KZ", "has_states": False, "default_vat": Decimal("0.12"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Kuwait", "code": "KW", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Malaysia", "code": "MY", "has_states": False, "default_vat": Decimal("0.10"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Pakistan", "code": "PK", "has_states": False, "default_vat": Decimal("0.17"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Philippines", "code": "PH", "has_states": False, "default_vat": Decimal("0.12"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Qatar", "code": "QA", "has_states": False, "default_vat": Decimal("0.00"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Saudi Arabia", "code": "SA", "has_states": False, "default_vat": Decimal("0.15"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Singapore", "code": "SG", "has_states": False, "default_vat": Decimal("0.09"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "South Korea", "code": "KR", "has_states": False, "default_vat": Decimal("0.10"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Taiwan", "code": "TW", "has_states": False, "default_vat": Decimal("0.05"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Thailand", "code": "TH", "has_states": False, "default_vat": Decimal("0.07"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "United Arab Emirates", "code": "AE", "has_states": False, "default_vat": Decimal("0.05"), "duty_rate": Decimal("0.00"), "states": []},
    {"name": "Vietnam", "code": "VN", "has_states": False, "default_vat": Decimal("0.10"), "duty_rate": Decimal("0.00"), "states": []},
]

def load_initial_data(apps, schema_editor):
    Country = apps.get_model('auctions', 'Country')
    State = apps.get_model('auctions', 'State')

    for entry in COUNTRY_DATA:
        country, _ = Country.objects.get_or_create(
            code=entry["code"],
            defaults={
                "name": entry["name"],
                "default_vat": entry["default_vat"],
                "has_states": entry["has_states"],
                "duty_rate": entry.get("duty_rate", Decimal("0.00")),
            },
        )

        if country.code == "US":
            for state_data in entry["states"]:
                State.objects.get_or_create(
                    country=country,
                    code=state_data["code"],
                    defaults={
                        "name": state_data["name"],
                        "tax_rate": state_data["tax_rate"],
                    },
                )

def reverse_load_initial_data(apps, schema_editor):
    Country = apps.get_model('auctions', 'Country')
    codes = [entry["code"] for entry in COUNTRY_DATA]
    Country.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0002_auto_20260519_2056'),
    ]

    operations = [
        migrations.RunPython(load_initial_data, reverse_load_initial_data),
    ]