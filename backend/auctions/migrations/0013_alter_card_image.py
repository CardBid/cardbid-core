from django.db import migrations
import cloudinary.models

class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0012_auctionslot_is_opened_alter_auction_auction_type_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='card',
            name='image',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='image'),
        ),
    ]