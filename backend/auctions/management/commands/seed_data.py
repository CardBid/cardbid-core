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
from auctions.models import CardbidUser, Card, Auction, Category, Bid, StreamRoom, AuctionSlot


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

        self.stdout.write("Tworzę losowych użytkowników...")
        users = []

        for i in range(2):
            username = f"streamer_{i+1}"
            user = CardbidUser.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="Test1234!",
                role="streamer",
                first_name="Streamer",
                last_name=str(i+1)
            )
            users.append(user)
            StreamRoom.objects.create(
                streamer=user,
                title=f"Wielkie otwieranie kart u {username}",
                stream_key=f"sb_{uuid.uuid4().hex[:8]}",
                is_live=True
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

            user = CardbidUser.objects.create_user(
                username=username,
                email=email,
                password="Test1234!",
                role=role,
                first_name=first_name,
                last_name=last_name,
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
            'pkmn': Category.objects.create(name='Pokémon', slug='pokemon'),
            'nba': Category.objects.create(name='Koszykówka', slug='koszykowka'),
            'fifa': Category.objects.create(name='Piłka Nożna', slug='pilka-nozna')
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