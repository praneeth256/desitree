#!/bin/bash
# Quick DNS Check Script - Use this to verify your domain is set up correctly

DOMAIN="desitree.in"
API_DOMAIN="api.desitree.in"

echo "🔍 Checking DesiTree Domain Configuration..."
echo "==========================================="
echo ""

echo "1️⃣  Checking Main Domain: $DOMAIN"
if dig +short $DOMAIN | grep -q .; then
    echo "✅ DNS records found for $DOMAIN"
    echo "   IP: $(dig +short $DOMAIN)"
else
    echo "❌ No DNS records found for $DOMAIN"
fi
echo ""

echo "2️⃣  Checking API Subdomain: $API_DOMAIN"
if dig +short $API_DOMAIN | grep -q .; then
    echo "✅ DNS records found for $API_DOMAIN"
    echo "   CNAME: $(dig +short $API_DOMAIN)"
else
    echo "❌ No DNS records found for $API_DOMAIN"
fi
echo ""

echo "3️⃣  Checking HTTPS/SSL..."
if curl -s -I https://$DOMAIN | grep -q "HTTP"; then
    echo "✅ HTTPS is working on $DOMAIN"
else
    echo "❌ HTTPS connection failed on $DOMAIN (may still be propagating)"
fi
echo ""

echo "4️⃣  Checking Frontend Response..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is responding (HTTP $FRONTEND_STATUS)"
else
    echo "⚠️  Frontend returned HTTP $FRONTEND_STATUS (check if page is deployed)"
fi
echo ""

echo "5️⃣  Checking Backend API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$API_DOMAIN)
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "404" ]; then
    echo "✅ Backend is responding (HTTP $API_STATUS)"
else
    echo "⚠️  Backend returned HTTP $API_STATUS (check if deployed)"
fi
echo ""

echo "==========================================="
echo "✨ Configuration check complete!"
echo ""
echo "📝 If DNS records are not found:"
echo "   • Wait 24-48 hours for DNS propagation"
echo "   • Use https://whatsmydns.net to check global propagation"
echo ""
echo "If you see ❌ or ⚠️  symbols:"
echo "   • Check CUSTOM_DOMAIN.md for detailed setup instructions"
echo "   • Verify DNS records in your registrar control panel"
