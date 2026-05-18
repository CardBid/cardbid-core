from decimal import Decimal

def calculate_fees(amount, user):
    if not user or not user.country:
        return {
            "base_price": amount,
            "vat": Decimal('0.00'),
            "duty": Decimal('0.00'),
            "total_cost": amount
        }

    country = user.country
    state = user.state
    
    duty = amount * country.duty_rate
    
    vat = Decimal('0.00')
    
    if country.has_states and state:
        vat = amount * state.tax_rate
    else:
        vat = amount * country.default_vat
        
    total = amount + vat + duty
    
    return {
        "base_price": amount,
        "vat": round(vat, 2),
        "duty": round(duty, 2),
        "total_cost": round(total, 2)
    }