#!/bin/bash

# Script de déploiement pour la configuration email de Gestocker
echo "🚀 Déploiement de la configuration email pour Gestocker"

# Vérifier si la CLI Supabase est installée
if ! command -v supabase &> /dev/null; then
    echo "❌ La CLI Supabase n'est pas installée. Installation en cours..."
    npm install -g supabase
fi

# Vérifier si l'utilisateur est connecté
echo "📋 Vérification de la connexion Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Supabase. Veuillez exécuter:"
    echo "   supabase login"
    exit 1
fi

# Demander le projet Supabase
echo "📝 Veuillez entrer l'URL de votre projet Supabase:"
read -p "Ex: https://votre-projet.supabase.co: " SUPABASE_URL

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ URL Supabase requise"
    exit 1
fi

# Extraire le project reference
PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')

echo "🔗 Connexion au projet: $PROJECT_REF"
supabase link --project-ref $PROJECT_REF

# Vérifier les variables d'environnement
echo "⚙️  Configuration des variables d'environnement..."

if [ ! -f "supabase/.env" ]; then
    echo "📁 Création du fichier .env..."
    cp supabase/.env.example supabase/.env
    echo "✅ Fichier .env créé. Veuillez le compléter avec vos clés API."
    echo "📝 Éditez supabase/.env et ajoutez:"
    echo "   - RESEND_API_KEY (recommandé) ou"
    echo "   - SENDGRID_API_KEY"
    echo ""
    echo "Puis relancez ce script."
    exit 1
fi

# Charger les variables d'environnement
source supabase/.env

# Vérifier les clés API
if [ -z "$RESEND_API_KEY" ] && [ -z "$SENDGRID_API_KEY" ]; then
    echo "❌ Aucune clé API trouvée. Veuillez configurer:"
    echo "   - RESEND_API_KEY dans supabase/.env (recommandé) ou"
    echo "   - SENDGRID_API_KEY dans supabase/.env"
    exit 1
fi

# Déployer l'Edge Function
echo "📦 Déploiement de l'Edge Function send-email..."
supabase functions deploy send-email

# Vérifier le déploiement
echo "🔍 Vérification du déploiement..."
supabase functions list

echo "✅ Déploiement terminé avec succès!"
echo ""
echo "📧 Prochaines étapes:"
echo "1. Configurez votre domaine d'envoi d'email (Resend/SendGrid)"
echo "2. Vérifiez les enregistrements DNS (SPF, DKIM)"
echo "3. Testez l'envoi d'email avec votre application"
echo ""
echo "📚 Documentation complète: docs/EMAIL_CONFIGURATION.md"
echo ""
echo "🧪 Pour tester localement:"
echo "   supabase functions serve --no-verify-jwt"
