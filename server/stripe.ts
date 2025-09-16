import Stripe from 'stripe';
import { Request, Response } from 'express';

// Stripe Setup mit API Keys aus Environment
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
}) : null;

/**
 * 💳 Stripe Checkout Session erstellen
 * Erstellt eine sichere Stripe Payment Session für Donations
 */
export async function createDonationCheckoutSession(req: Request, res: Response) {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Stripe nicht konfiguriert. Spenden derzeit nicht verfügbar.'
      });
    }

    const { amount, donorName, recipientName } = req.body;

    // Validation
    if (!amount || amount < 1) {
      return res.status(400).json({ 
        error: 'Ungültiger Betrag. Mindestens 1€ erforderlich.' 
      });
    }

    if (!donorName || !recipientName) {
      return res.status(400).json({ 
        error: 'Spender und Empfänger Name sind erforderlich.' 
      });
    }

    // Stripe Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `💖 Spende für ${recipientName}`,
            description: `Spende von ${donorName} für das Garten-Spiel`,
          },
          unit_amount: Math.round(amount * 100), // Cent Umwandlung
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.REPLIT_DOMAIN || 'http://localhost:5000'}/donation-cancelled`,
      metadata: {
        donorName,
        recipientName,
        gameType: 'garden-donation'
      }
    });

    res.json({ 
      checkoutUrl: session.url,
      sessionId: session.id
    });

  } catch (error) {
    console.error('❌ Stripe Checkout Error:', error);
    res.status(500).json({ 
      error: 'Fehler beim Erstellen der Donation Session.' 
    });
  }
}

/**
 * 🔍 Donation Status prüfen
 * Prüft den Status einer Stripe Payment Session
 */
export async function getDonationStatus(req: Request, res: Response) {
  try {
    if (!stripe) {
      return res.status(503).json({
        error: 'Stripe nicht konfiguriert.'
      });
    }

    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      status: session.payment_status,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      metadata: session.metadata
    });

  } catch (error) {
    console.error('❌ Stripe Status Check Error:', error);
    res.status(500).json({ 
      error: 'Fehler beim Prüfen des Donation Status.' 
    });
  }
}

/**
 * 🎯 Webhook für Payment Events
 * Verarbeitet Stripe Webhook Events für erfolgreiche Payments
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET nicht konfiguriert');
    return res.status(400).send('Webhook Secret fehlt');
  }

  try {
    if (!stripe) {
      return res.status(503).send('Stripe nicht konfiguriert');
    }

    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Donation erfolgreich:', {
          sessionId: session.id,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency,
          donor: session.metadata?.donorName,
          recipient: session.metadata?.recipientName
        });
        
        // Hier könntest du weitere Aktionen ausführen:
        // - Credits an Empfänger vergeben
        // - Notification senden
        // - Donation in Database speichern
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Donation fehlgeschlagen:', event.data.object);
        break;

      default:
        console.log(`🔄 Unbekannter Event Type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(400).send('Webhook Error');
  }
}