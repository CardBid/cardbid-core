import random
import os
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files import File
from django.conf import settings
from auctions.models import CardbidUser, Category, Card, Auction

class Command(BaseCommand):
    help = 'Finalna wersja z logiką 40% Kup Teraz i 60% Licytacja'

    def handle(self, *args, **options):
        source_dir = os.path.join(settings.MEDIA_ROOT, 'source_images')
        txt_path = os.path.join(settings.BASE_DIR, 'Opisy .txt')

        if not os.path.exists(txt_path):
            self.stdout.write(self.style.ERROR("BŁĄD: Brak pliku Opisy .txt"))
            return

        with open(txt_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f.readlines() if " – " in line]
        
        desc_groups = {
            'pkmn': lines[0:20],
            'nba': lines[20:35],
            'fifa': lines[35:50]
        }

        self.stdout.write("Czyszczenie bazy danych...")
        Card.objects.all().delete()
        Category.objects.all().delete()
        Auction.objects.all().delete()
        
        cat_map = {
            'pkmn': Category.objects.create(name='Pokémon', slug='pokemon'),
            'nba': Category.objects.create(name='Koszykówka', slug='koszykowka'),
            'fifa': Category.objects.create(name='Piłka Nożna', slug='pilka-nozna')
        }
        
        seller, _ = CardbidUser.objects.get_or_create(
            username='admin', 
            defaults={'role':'seller', 'is_staff':True, 'is_superuser':True}
        )

        all_files = [os.path.join(source_dir, f) for f in os.listdir(source_dir) if f.lower().endswith(('.jpg', '.png', '.jpeg'))]
        
        img_groups = {
            'pkmn': [f for f in all_files if "_pokemon" in f.lower()],
            'nba': [f for f in all_files if "_nba" in f.lower()],
            'fifa': [f for f in all_files if "_fifa" in f.lower()]
        }

        def process_group(descriptions, available_images, category, group_label):
            used_images = set()
            results = [None] * len(descriptions)

            self.stdout.write(f"\n--- Grupa: {group_label} ---")

            for i, desc in enumerate(descriptions):
                full_name_raw = desc.split(' – ')[0].strip().lower()
                parts = full_name_raw.replace('_', ' ').replace('.', ' ').split()
                if not parts: continue
                keyword = max(parts, key=len)

                for img_path in available_images:
                    if img_path in used_images: continue
                    if keyword in os.path.basename(img_path).lower():
                        results[i] = img_path
                        used_images.add(img_path)
                        self.stdout.write(self.style.SUCCESS(f"OK: {full_name_raw} -> {os.path.basename(img_path)}"))
                        break

            for i, desc in enumerate(descriptions):
                if results[i] is None:
                    for img_path in available_images:
                        if img_path not in used_images:
                            results[i] = img_path
                            used_images.add(img_path)
                            name_short = desc.split(' – ')[0]
                            self.stdout.write(self.style.WARNING(f"LOS: {name_short} -> {os.path.basename(img_path)}"))
                            break

            count = 0
            for i, img_path in enumerate(results):
                if img_path:
                    desc_text = descriptions[i]
                    display_name = desc_text.split(' – ')[0].replace('_', ' ')
                    
                    card = Card.objects.create(
                        name=f"{display_name} #2026",
                        description=desc_text,
                        category=category,
                        grade=random.choice(['PSA 10', 'PSA 9', 'BGS 9.5', 'Mint 9']),
                        certificate_number=str(random.randint(1000000, 9999999))
                    )
                    
                    with open(img_path, 'rb') as f:
                        card.image.save(os.path.basename(img_path), File(f), save=True)

                    # LOGIKA 40% Kup Teraz / 60% Licytacja
                    chance = random.randint(1, 100)
                    if chance <= 40:
                        a_type = 'buy_now'
                        # Dla "Kup Teraz" ustawiamy buy_now_price (metoda clean() zajmie się resztą)
                        buy_now_val = random.randint(200, 1500)
                        starting_val = None
                    else:
                        a_type = 'bidding'
                        # Dla licytacji ustawiamy starting_price
                        buy_now_val = None
                        starting_val = random.randint(10, 300)

                    Auction.objects.create(
                        card=card,
                        seller=seller,
                        auction_type=a_type,
                        starting_price=starting_val,
                        buy_now_price=buy_now_val,
                        start_date=timezone.now(),
                        end_date=timezone.now() + timedelta(days=7),
                        status='active'
                    )
                    count += 1
            return count

        total = 0
        total += process_group(desc_groups['pkmn'], img_groups['pkmn'], cat_map['pkmn'], "POKEMON")
        total += process_group(desc_groups['nba'], img_groups['nba'], cat_map['nba'], "NBA")
        total += process_group(desc_groups['fifa'], img_groups['fifa'], cat_map['fifa'], "FIFA")

        self.stdout.write(self.style.SUCCESS(f"\nGOTOWE! Utworzono {total} aukcji z podziałem 40/60."))