# Generated by Django 5.2.3 on 2025-07-04 16:13

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SpotifyUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('spotify_id', models.CharField(max_length=100, unique=True)),
                ('display_name', models.CharField(max_length=255)),
                ('email', models.EmailField(max_length=254)),
                ('profile_image', models.URLField(blank=True, null=True)),
                ('access_token', models.CharField(max_length=255)),
                ('refresh_token', models.CharField(max_length=255)),
                ('scope', models.TextField()),
                ('token_expires_in', models.IntegerField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
