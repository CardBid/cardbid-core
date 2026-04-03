import random
import unicodedata
from decimal import Decimal
from django.core.management.base import BaseCommand
from faker import Faker
from auctions.models import CardbidUser, Card, Auction


class Command(BaseCommand):
    help = "Generuje losowe dane testowe przy użyciu Faker"

    def slugify_text(self, text):
        text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
        text = text.lower().replace(" ", ".").replace("-", ".")
        return "".join(ch for ch in text if ch.isalnum() or ch == ".")

    def handle(self, *args, **kwargs):
        fake = Faker("pl_PL")

        self.stdout.write("Usuwam stare dane testowe...")
        Auction.objects.all().delete()
        Card.objects.all().delete()
        CardbidUser.objects.filter(is_superuser=False).delete()

        self.stdout.write("Tworzę losowych użytkowników...")
        users = []
        roles = ["buyer", "seller", "seller", "buyer", "seller", "admin"]

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

        # losowo wybierz dwóch użytkowników i zrób z nich adminów Django
        if len(users) >= 2:
            admin_candidates = random.sample(users, 2)
            for u in admin_candidates:
                u.is_staff = True
                u.is_superuser = True
                u.role = "admin"
                u.save()

        sellers = [u for u in users if u.role == "seller"]

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

            card = Card.objects.create(
                name=card_name,
                description=f"{fake.sentence(nb_words=10).rstrip('.')} - {random.choice(description_tags)}.",
                grade=random.choice(rarity_levels),
                certificate_number=f"CERT-{random.randint(10000, 99999)}",
            )
            cards.append(card)

        self.stdout.write("Tworzę losowe aukcje...")

        statuses = ["active", "ended"]

        for card in cards:
            starting_price = Decimal(str(round(random.uniform(40, 7000), 2)))
            current_price = starting_price + Decimal(str(round(random.uniform(0, 3000), 2)))

            Auction.objects.create(
                seller=random.choice(sellers),
                card=card,
                starting_price=starting_price,
                current_price=current_price,
                status=random.choice(statuses),
            )

        self.stdout.write(self.style.SUCCESS("Gotowe! Wygenerowano lepsze losowe dane przez Faker."))