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
from datetime import date
import cloudinary.uploader
import shutil

# --- KONFIGURACJA KATEGORII ---
DOMAINS = {
    'pkmn': ('Pokémon', ['pokemon', 'pkmn']),
    'nba': ('NBA', ['nba', 'basketball', 'basket']),
    'soccer': ('Soccer', ['fifa', 'football', 'soccer', 'pilka']),
    'golf': ('Golf', ['golf']),
    'wwe': ('WWE', ['wwe', 'wrestling']),
    'mma': ('MMA', ['mma', 'ufc'])
}

SUB_TYPES = ['Single Cards', 'Sealed Boxes', 'Booster Packs', 'Accessories']


class Command(BaseCommand):
    help = "Generuje dane Faker + realne zdjęcia i rozszerzone kategorie"

    def slugify_text(self, text):
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = text.lower().replace(" ", "-").replace(".", "")
        return "".join(ch for ch in text if ch.isalnum() or ch == "-")

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

        self.stdout.write("Pobieram kraje i stany z bazy danych...")
        poland = Country.objects.filter(code="PL").first()
        usa = Country.objects.filter(code="US").first()
        
        all_states = list(usa.states.all())

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
                    'last_name': str(i),
                    'birth_date': date(1990, 1, 1)
                }
            )
            
            if created:
                user.set_password("Test1234!")
                user.save()
            users.append(user)

            StreamRoom.objects.update_or_create(
                streamer=user,
                defaults={
                    'title': f"Big opening {username}",
                    'stream_key': f"sb_{uuid.uuid4().hex[:8]}",
                    'is_live': True
                }
            )

        roles = ["buyer", "seller", "seller", "buyer", "seller"]

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
            user_state = random.choice(all_states) if user_country.has_states and all_states else None

            user_birth_date = date(date.today().year - random.randint(18, 50), random.randint(1, 12), random.randint(1, 28))

            user = CardbidUser.objects.create_user(
                username=username,
                email=email,
                password="Test1234!",
                role=role,
                first_name=first_name,
                last_name=last_name,
                country=user_country,
                state=user_state,
                balance=Decimal(random.randint(500, 5000)),
                shipping_address=fake.address(),
                birth_date=user_birth_date
            )
            users.append(user)

            if role == "streamer":
                StreamRoom.objects.create(
                    streamer=user,
                    title=f"Auctions {username}",
                    stream_key=f"sb_{uuid.uuid4().hex[:8]}",
                    is_live=random.choice([True, False])
                )

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
                username="jan_sprzedawca_101", email="jan@example.com", password="Test1234!",
                role="seller", first_name="Jan", last_name="Sprzedawca", birth_date=date(1985, 5, 15)
            )
            sellers.append(fallback)
            users.append(fallback)
            buyers.append(fallback)

        self.stdout.write("Tworzę macierz wszystkich kategorii...")
        categories_map = {}
        for key, (domain_name, _) in DOMAINS.items():
            categories_map[key] = []
            for sub in SUB_TYPES:
                cat_name = f"{domain_name} - {sub}"
                cat, _ = Category.objects.get_or_create(
                    name=cat_name, 
                    defaults={'slug': self.slugify_text(cat_name)}
                )
                categories_map[key].append(cat)

        self.stdout.write("Przetwarzam plik Opisy.txt...")
        with open(txt_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if " – " in line]
        
        desc_groups = {}
        chunk_size = max(3, len(lines) // len(DOMAINS))
        for i, key in enumerate(DOMAINS.keys()):
            start_idx = i * chunk_size
            extracted = lines[start_idx:start_idx+chunk_size]
            if not extracted:
                extracted = [f"{DOMAINS[key][0]} Item {j} – Wspaniały przedmiot do kolekcji" for j in range(5)]
            desc_groups[key] = extracted

        self.stdout.write("Przeszukuję obrazy...")
        all_files = []
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if file.lower().endswith(('.jpg', '.png', '.jpeg', '.webp')):
                    all_files.append(os.path.join(root, file))

        img_groups = {}
        for key, (_, keywords) in DOMAINS.items():
            img_groups[key] = [f for f in all_files if any(kw in f.lower() for kw in keywords)]
            if not img_groups[key]:
                img_groups[key] = all_files

        all_auctions = []

        def process_group(descriptions, available_images, category_choices, label):
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
                    
                    chosen_category = random.choice(category_choices)
                    is_single_card = 'Single Cards' in chosen_category.name
                    
                    card = Card.objects.create(
                        name=display_name,
                        description=desc,
                        category=chosen_category,
                        grade=random.choice(['PSA 10', 'PSA 9', 'BGS 9.5', 'Mint 9', 'Raw']) if is_single_card else 'N/A',
                        certificate_number=f"CERT-{random.randint(1000000, 9999999)}" if is_single_card else ""
                    )
                    
                    self.stdout.write(f"Wgrywam {os.path.basename(matched_img)} do Cloudinary... Kategoria: {chosen_category.name}")
                    try:
                        filename_without_ext = os.path.splitext(os.path.basename(matched_img))[0]
                        fixed_public_id = f"cardbid_cards/{filename_without_ext}"

                        upload_result = cloudinary.uploader.upload(
                            matched_img,
                            public_id=fixed_public_id,
                            overwrite=True
                        )

                        card.image = upload_result['public_id']
                        card.save()
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Błąd Cloudinary: {e}"))

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

        self.stdout.write("Generuję aukcje dla wszystkich dyscyplin...")
        for key in DOMAINS.keys():
            process_group(desc_groups[key], img_groups[key], categories_map[key], DOMAINS[key][0].upper())

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

        self.stdout.write(self.style.SUCCESS(f"Dane gotowe, wygenerowano wszystkie struktury kategorii!"))