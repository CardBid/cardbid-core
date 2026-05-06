from django.db import migrations
from decimal import Decimal

def load_initial_data(apps, schema_editor):
    Country = apps.get_model('auctions', 'Country')
    State = apps.get_model('auctions', 'State')

    poland, created = Country.objects.get_or_create(
        code="PL",
        defaults={
            'name': 'Poland',
            'default_vat': Decimal('0.23'),
            'has_states': False,
            'duty_rate': Decimal('0.00')
        }
    )

    usa, created = Country.objects.get_or_create(
        code="US",
        defaults={
            'name': 'USA',
            'default_vat': Decimal('0.00'),
            'has_states': True,
            'duty_rate': Decimal('0.05')
        }
    )

    uk, created = Country.objects.get_or_create(
        code="GB",
        defaults={
            'name': 'United Kingdom',
            'default_vat': Decimal('0.20'),
            'has_states': False,
            'duty_rate': Decimal('0.02')
        }
    )

    states_data = [
        {'name': 'California', 'code': 'CA', 'tax_rate': Decimal('0.0825')},
        {'name': 'New York', 'code': 'NY', 'tax_rate': Decimal('0.0887')},
        {'name': 'Texas', 'code': 'TX', 'tax_rate': Decimal('0.0625')},
        {'name': 'Florida', 'code': 'FL', 'tax_rate': Decimal('0.0600')},
        {'name': 'Illinois', 'code': 'IL', 'tax_rate': Decimal('0.0874')}
    ]

    for state_data in states_data:
        State.objects.get_or_create(
            country=usa,
            code=state_data['code'],
            defaults={
                'name': state_data['name'],
                'tax_rate': state_data['tax_rate']
            }
        )

def reverse_load_initial_data(apps, schema_editor):
    Country = apps.get_model('auctions', 'Country')
    Country.objects.filter(code__in=["PL", "US", "GB"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0009_cardbiduser_birth_date'),
    ]

    operations = [
        migrations.RunPython(load_initial_data, reverse_load_initial_data),
    ]