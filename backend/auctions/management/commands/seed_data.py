import random
import unicodedata
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from faker import Faker
from auctions.models import CardbidUser, Card, Auction, Category, Bid, StreamRoom


class Command(BaseCommand):
    help = "Generuje losowe dane testowe przy użyciu Faker"

    def slugify_text(self, text):
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = text.lower().replace(" ", ".").replace("-", ".")
        return "".join(ch for ch in text if ch.isalnum() or ch == ".")

    def handle(self, *args, **kwargs):
        fake = Faker("pl_PL")

        self.stdout.write("Usuwam stare dane testowe...")
        Bid.objects.all().delete()
        StreamRoom.objects.all().delete()
        Auction.objects.all().delete()
        Card.objects.all().delete()
        Category.objects.all().delete()
        CardbidUser.objects.filter(is_superuser=False).delete()

        self.stdout.write("Tworzę losowych użytkowników...")
        users = []
        roles = ["buyer", "seller", "seller", "buyer", "seller", "streamer", "admin"]

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
        cat_anime = Category.objects.create(name="Anime", slug="anime")
        cat_sport = Category.objects.create(name="Sport", slug="sport")
        cat_auto = Category.objects.create(name="Motoryzacja", slug="motoryzacja")
        cat_gry = Category.objects.create(name="Gry Karciane", slug="gry-karciane")

        self.stdout.write("Tworzę losowe karty...")

        anime_cards = [
            "Naruto Sage Mode",
            "One Piece Gear 5 Luffy",
            "Dragon Ball Ultra Instinct Goku",
            "Attack on Titan Levi Ackerman",
            "Demon Slayer Rengoku Flame",
            "Jujutsu Kaisen Gojo Limitless",
            "Bleach Bankai Ichigo",
            "Chainsaw Man Denji Hybrid",
        ]

        sport_cards = [
            "NBA LeBron James Prizm",
            "NBA Stephen Curry Mosaic",
            "Football Lionel Messi Chrome",
            "Football Cristiano Ronaldo Elite",
            "F1 Max Verstappen Pole Position",
            "NFL Patrick Mahomes Select",
            "MLB Shohei Ohtani Diamond",
            "UFC Conor McGregor Spotlight",
        ]

        auto_cards = [
            "Nissan Skyline GT-R R34 Midnight",
            "Toyota Supra MK4 Turbo",
            "Mazda RX-7 Spirit R",
            "Honda NSX Type R",
            "BMW M3 GTR Street",
            "Porsche 911 GT3 RS Track",
            "Ferrari F40 Legend",
            "Lamborghini Aventador SVJ Carbon",
        ]

        game_cards = [
            "Pokemon Charizard VMAX",
            "Pokemon Mewtwo EX",
            "Yu-Gi-Oh Blue-Eyes White Dragon",
            "Yu-Gi-Oh Dark Magician",
            "Magic Black Lotus Vintage",
            "Magic Jace the Mind Sculptor",
            "Witcher Gwent Geralt Hero",
            "Cyberpunk Johnny Silverhand Relic",
        ]

        all_cards = anime_cards + sport_cards + auto_cards + game_cards

        category_map = {}
        for c in anime_cards: category_map[c] = cat_anime
        for c in sport_cards: category_map[c] = cat_sport
        for c in auto_cards: category_map[c] = cat_auto
        for c in game_cards: category_map[c] = cat_gry

        rarity_levels = [
            "Common",
            "Uncommon",
            "Rare",
            "Epic",
            "Legendary",
            "Collector",
            "Ultra Rare",
        ]

        description_tags = [
            "edycja limitowana",
            "stan kolekcjonerski",
            "wysokie zainteresowanie na rynku",
            "dobry egzemplarz do gradingu",
            "rzadko spotykana karta",
            "atrakcyjna pozycja dla kolekcjonera",
            "wydanie premium",
            "ceniony motyw wśród fanów",
        ]

        cards = []
        used_names = set()

        while len(cards) < 30:
            base_name = random.choice(all_cards)
            extra = random.choice(["Holo", "Full Art", "1st Edition", "Signed", "Gold", "Alt Art"])
            card_name = f"{base_name} {extra}"

            if card_name in used_names:
                continue

            used_names.add(card_name)

            correct_category = category_map[base_name]

            card = Card.objects.create(
                name=card_name,
                description=f"{fake.sentence(nb_words=10).rstrip('.')} - {random.choice(description_tags)}.",
                category=correct_category,
                grade=random.choice(rarity_levels),
                certificate_number=f"CERT-{random.randint(10000, 99999)}",
            )
            cards.append(card)

        self.stdout.write("Tworzę losowe aukcje i historię licytacji...")

        statuses = ["active", "active", "ended", "ended", "cancelled"]
        auction_types = ["bidding", "buy_now", "hybrid"]

        for card in cards:
            a_type = random.choice(auction_types)
            status = random.choice(statuses)

            start_date = timezone.now() - timedelta(days=random.randint(0, 5))
            end_date = timezone.now() + timedelta(days=random.randint(1, 10)) if status == "active" else timezone.now() - timedelta(days=1)

            base_price = Decimal(str(round(random.uniform(40, 7000), 2)))

            if a_type == "buy_now":
                sp = None
                bnp = base_price
                cp = base_price
            elif a_type == "bidding":
                sp = base_price
                bnp = None
                cp = sp
            else: # hybrid
                sp = base_price
                bnp = base_price * Decimal('1.5')
                cp = sp

            auction = Auction.objects.create(
                seller=random.choice(sellers),
                card=card,
                starting_price=sp,
                current_price=cp,
                buy_now_price=bnp,
                auction_type=a_type,
                status=status,
                start_date=start_date,
                end_date=end_date,
            )

            auction.clean()
            auction.save()

            if a_type in ["bidding", "hybrid"] and random.choice([True, False]):
                num_bids = random.randint(1, 5)
                current_bid_val = sp
                winner = None
                
                for _ in range(num_bids):
                    current_bid_val += Decimal(str(round(random.uniform(10, 200), 2)))
                    bidder = random.choice(buyers)
                    
                    if bidder != auction.seller:
                        Bid.objects.create(
                            auction=auction,
                            user=bidder,
                            amount=current_bid_val
                        )
                        winner = bidder
                        
                auction.current_price = current_bid_val
                if status == "ended" and winner:
                    auction.winner = winner
                auction.save()

            elif a_type == "buy_now" and status == "ended":
                auction.winner = random.choice(buyers)
                auction.save()

        self.stdout.write(self.style.SUCCESS("Gotowe! Wygenerowano lepsze losowe dane przez Faker."))