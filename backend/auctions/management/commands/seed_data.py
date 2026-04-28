import os
from django.conf import settings
import random
import unicodedata
import uuid
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.core.files import File
from django.core.management.base import BaseCommand
from faker import Faker
from auctions.models import CardbidUser, Card, Auction, Category, Bid, StreamRoom, AuctionSlot, Country, State

import shutil


class Command(BaseCommand):
    help = "Generuje dane Faker + realne zdjęcia i opisy z pliku TXT"

    def slugify_text(self, text):
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = text.lower().replace(" ", ".").replace("-", ".")
        return "".join(ch for ch in text if ch.isalnum() or ch == ".")

    def handle(self, *args, **kwargs):
        fake = Faker("pl_PL")
        source_dir = os.path.join(settings.MEDIA_ROOT, 'source_images')
        txt_path = os.path.join(settings.BASE_DIR, 'Opisy.txt')

        if not os.path.exists(source_dir):
            self.stdout.write(self.style.ERROR(f"BŁĄD: Folder {source_dir} nie istnieje!"))
            return

        if not os.path.exists(txt_path):
            self.stdout.write(self.style.ERROR(f"BŁĄD: Brak pliku {txt_path}"))
            return

        self.stdout.write("Usuwam stare dane testowe...")
        AuctionSlot.objects.all().delete()
        Bid.objects.all().delete()
        StreamRoom.objects.all().delete()
        Auction.objects.all().delete()
        Card.objects.all().delete()
        Category.objects.all().delete()
        CardbidUser.objects.filter(is_superuser=False).delete()

        cards_dir = os.path.join(settings.MEDIA_ROOT, 'cards')
        if os.path.exists(cards_dir):
            shutil.rmtree(cards_dir)
            self.stdout.write("Folder media/cards wyczyszczony.")

        os.makedirs(cards_dir, exist_ok=True)

        self.stdout.write("Tworzę kraje i stany...")
        poland, _ = Country.objects.get_or_create(
            code="PL", 
            defaults={'name': 'Poland', 'default_vat': Decimal('0.23'), 'has_states': False}
        )
        usa, _ = Country.objects.get_or_create(
            code="US", 
            defaults={'name': 'USA', 'default_vat': Decimal('0.00'), 'has_states': True, 'duty_rate': Decimal('0.05')}
        )
        states_data = [
            {'name': 'California', 'code': 'CA', 'tax_rate': Decimal('0.08')},
            {'name': 'New York', 'code': 'NY', 'tax_rate': Decimal('0.04')},
            {'name': 'Texas', 'code': 'TX', 'tax_rate': Decimal('0.06')},
        ]
        all_states = []
        for s in states_data:
            state_obj, _ = State.objects.get_or_create(country=usa, code=s['code'], defaults={'name': s['name'], 'tax_rate': s['tax_rate']})
            all_states.append(state_obj)

        self.stdout.write("Tworzę losowych użytkowników...")
        users = []

        for i in range(1, 3):
            username = f"streamer_{i}"
            user, created = CardbidUser.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{username}@example.com",
                    'role': 'streamer',
                    'first_name': 'Streamer',
                    'last_name': str(i)
                }
            )
            
            if created:
                user.set_password("Test1234!")
                user.save()
                self.stdout.write(f"Stworzono nowego użytkownika: {username}")
            else:
                self.stdout.write(f"Użytkownik {username} już istnieje, pomijam tworzenie.")
            
            users.append(user)

            StreamRoom.objects.update_or_create(
                streamer=user,
                defaults={
                    'title': f"Wielkie otwieranie kart u {username}",
                    'stream_key': f"sb_{uuid.uuid4().hex[:8]}",
                    'is_live': True
                }
            )

        roles = ["buyer", "seller", "seller", "buyer", "seller"]

        # najpierw tworzymy zwykłych userów
        for _ in range(15):
            first_name = fake.first_name()
            last_name = fake.last_name()
            first_part = self.slugify_text(first_name)
            last_part = self.slugify_text(last_name)
            number = random.randint(10, 999)

            username = f"{first_part}_{last_part}_{number}"
            email = f"{first_part}.{last_part}{number}@example.com"
            role = random.choice(roles)

            user_country = random.choice([poland, usa])
            user_state = random.choice(all_states) if user_country.has_states else None

            user = CardbidUser.objects.create_user(
                username=username,
                email=email,
                password="Test1234!",
                role=role,
                first_name=first_name,
                last_name=last_name,
                # --- NOWE POLA ---
                country=user_country,
                state=user_state,
                balance=Decimal(random.randint(500, 5000)),
                shipping_address=fake.address()
            )
            users.append(user)

            if role == "streamer":
                StreamRoom.objects.create(
                    streamer=user,
                    title=f"Licytacje u {username}",
                    stream_key=f"sb_{uuid.uuid4().hex[:8]}",
                    is_live=random.choice([True, False])
                )

        # losowo wybierz dwóch użytkowników i zrób z nich adminów Django
        if len(users) >= 2:
            admin_candidates = random.sample(users, 2)
            for u in admin_candidates:
                u.is_staff = True
                u.is_superuser = True
                u.role = "admin"
                u.save()

        sellers = [u for u in users if u.role in ["seller", "streamer"]]
        buyers = [u for u in users if u.role in ["buyer", "seller", "streamer"]]

        if not sellers:
            fallback = CardbidUser.objects.create_user(
                username="jan_sprzedawca_101",
                email="jan.sprzedawca101@example.com",
                password="Test1234!",
                role="seller",
                first_name="Jan",
                last_name="Sprzedawca",
            )
            sellers.append(fallback)
            users.append(fallback)
            buyers.append(fallback)

        self.stdout.write("Tworzę kategorie w bazie...")
        cat_map = {
            'pkmn': Category.objects.get_or_create(name='Pokémon', defaults={'slug': 'pokemon'})[0],
            'nba': Category.objects.get_or_create(name='Koszykówka', defaults={'slug': 'koszykowka'})[0],
            'fifa': Category.objects.get_or_create(name='Piłka Nożna', defaults={'slug': 'pilka-nozna'})[0]
        }

        with open(txt_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if " – " in line]
        
        desc_groups = {
            'pkmn': lines[0:20],
            'nba': lines[20:35],
            'fifa': lines[35:50]
        }

        all_files = []
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.png', '.jpeg')):
                    all_files.append(os.path.join(root, file))

        img_groups = {
            'pkmn': [f for f in all_files if "pokemon" in f.lower() or "pkmn" in f.lower()],
            'nba': [f for f in all_files if "nba" in f.lower()],
            'fifa': [f for f in all_files if "fifa" in f.lower() or "football" in f.lower() or "pilka" in f.lower()]
        }

        all_auctions = []

        def process_group(descriptions, available_images, category, label):
            count = 0
            used_images = set()
            
            for desc in descriptions:
                full_name_raw = desc.split(' – ')[0].strip().lower()
                keyword = max(full_name_raw.replace('_', ' ').split(), key=len)
                
                matched_img = None
                for img_path in available_images:
                    if img_path not in used_images and keyword in os.path.basename(img_path).lower():
                        matched_img = img_path
                        used_images.add(img_path)
                        break
                
                if not matched_img:
                    for img_path in available_images:
                        if img_path not in used_images:
                            matched_img = img_path
                            used_images.add(img_path)
                            break
                
                if matched_img:
                    display_name = desc.split(' – ')[0].replace('_', ' ')
                    card = Card.objects.create(
                        name=f"{display_name} #2026",
                        description=desc,
                        category=category,
                        grade=random.choice(['PSA 10', 'PSA 9', 'BGS 9.5', 'Mint 9']),
                        certificate_number=f"CERT-{random.randint(1000000, 9999999)}"
                    )
                    
                    with open(matched_img, 'rb') as f:
                        card.image.save(os.path.basename(matched_img), File(f), save=True)

                    chance = random.randint(1, 100)
                    a_type = 'buy_now' if chance <= 40 else 'bidding'
                    price = Decimal(str(random.randint(50, 2000)))

                    auction = Auction.objects.create(
                        card=card,
                        seller=random.choice(sellers),
                        auction_type=a_type,
                        starting_price=price if a_type == 'bidding' else None,
                        buy_now_price=price * Decimal('1.5') if a_type != 'bidding' else price * Decimal('2.0'),
                        current_price=price if a_type == 'bidding' else price * Decimal('2.0'),
                        status='active',
                        start_date=timezone.now(),
                        end_date=timezone.now() + timedelta(days=7)
                    )
                    all_auctions.append(auction)
                    count += 1
            return count

        self.stdout.write("Generuję aukcje...")
        process_group(desc_groups['pkmn'], img_groups['pkmn'], cat_map['pkmn'], "PKMN")
        process_group(desc_groups['nba'], img_groups['nba'], cat_map['nba'], "NBA")
        process_group(desc_groups['fifa'], img_groups['fifa'], cat_map['fifa'], "FIFA")

        self.stdout.write("Generuję historię licytacji...")
        for auction in all_auctions:
            if auction.auction_type == 'bidding' and random.choice([True, False]):
                for _ in range(random.randint(1, 5)):
                    bidder = random.choice(buyers)
                    if bidder != auction.seller:
                        amount = auction.current_price + Decimal(random.randint(5, 50))
                        Bid.objects.create(auction=auction, user=bidder, amount=amount)
                        auction.current_price = amount
                        auction.save()

        self.stdout.write("Ustawiam sloty u streamerów...")
        rooms = StreamRoom.objects.all()
        random.shuffle(all_auctions)
        for room in rooms:
            for i in range(1, 4):
                if not all_auctions: break
                slot_status = 'FINISHED' if i == 1 else ('ACTIVE' if i == 2 else 'PENDING')
                AuctionSlot.objects.create(
                    room=room,
                    auction=all_auctions.pop(),
                    order=i,
                    status=slot_status
                )

        self.stdout.write(self.style.SUCCESS(f"Dane gotowe, użyto realnych zdjęć i opisów."))