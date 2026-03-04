import React, { useState } from 'react';
import { otp, auth } from '../config/supabase';

const TestOTP = () => {
  const [step, setStep] = useState(1); // 1: inscription, 2: verification OTP, 3: succès
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Étape 1: Données d'inscription
  const [inscriptionData, setInscriptionData] = useState({
    nom: '',
    email: '',
    mot_de_passe: '',
    confirm_mot_de_passe: '',
    nom_entreprise: '',
    raison_sociale: '',
    ifu: '',
    registre_commerce: '',
    telephone_entreprise: '',
    email_entreprise: ''
  });

  // Étape 2: Code OTP
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState(null); // Pour développement

  // Étape 1: Envoyer le code OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (inscriptionData.mot_de_passe !== inscriptionData.confirm_mot_de_passe) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }

      if (inscriptionData.mot_de_passe.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }

      // Envoyer le code OTP
      const result = await otp.generateOTP(inscriptionData.email);
      
      if (result.success) {
        setSuccess(`Code OTP envoyé à ${inscriptionData.email}`);
        setStep(2);
        
        // En développement, afficher le code
        if (result.otpCode) {
          setGeneratedOTP(result.otpCode);
          setSuccess(`Code OTP envoyé! Code de développement: ${result.otpCode}`);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Valider le code OTP et créer le compte
  const handleValidateOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Valider le code OTP
      const validation = await otp.validateOTP(inscriptionData.email, otpCode);
      
      if (!validation.success) {
        setError(validation.message);
        return;
      }

      // Créer le compte
      const signupResult = await auth.signUp(
        inscriptionData.email,
        inscriptionData.mot_de_passe,
        {
          nom: inscriptionData.nom,
          nom_entreprise: inscriptionData.nom_entreprise,
          raison_sociale: inscriptionData.raison_sociale,
          ifu: inscriptionData.ifu,
          registre_commerce: inscriptionData.registre_commerce,
          telephone_entreprise: inscriptionData.telephone_entreprise,
          email_entreprise: inscriptionData.email_entreprise || inscriptionData.email
        }
      );

      if (signupResult.data) {
        setSuccess('Compte créé avec succès! Redirection...');
        setStep(3);
        
        // Stocker la session
        localStorage.setItem('userSession', JSON.stringify(signupResult.data));
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setError(signupResult.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test de connexion
  const handleTestConnexion = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await auth.signIn(inscriptionData.email, inscriptionData.mot_de_passe);
      
      if (result.data) {
        setSuccess('Connexion réussie! Redirection vers le dashboard...');
        localStorage.setItem('userSession', JSON.stringify(result.data));
        
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>🧪 Test Complet Système OTP</h1>
      
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>❌ Erreur:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>✅ Succès:</strong> {success}
        </div>
      )}

      {/* Étape 1: Formulaire d'inscription */}
      {step === 1 && (
        <div>
          <h2>Étape 1: Inscription</h2>
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: '15px' }}>
              <label>Nom complet:</label>
              <input
                type="text"
                required
                value={inscriptionData.nom}
                onChange={(e) => setInscriptionData({...inscriptionData, nom: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Email:</label>
              <input
                type="email"
                required
                value={inscriptionData.email}
                onChange={(e) => setInscriptionData({...inscriptionData, email: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Mot de passe:</label>
              <input
                type="password"
                required
                value={inscriptionData.mot_de_passe}
                onChange={(e) => setInscriptionData({...inscriptionData, mot_de_passe: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Confirmer mot de passe:</label>
              <input
                type="password"
                required
                value={inscriptionData.confirm_mot_de_passe}
                onChange={(e) => setInscriptionData({...inscriptionData, confirm_mot_de_passe: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Nom de l'entreprise:</label>
              <input
                type="text"
                required
                value={inscriptionData.nom_entreprise}
                onChange={(e) => setInscriptionData({...inscriptionData, nom_entreprise: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>IFU:</label>
              <input
                type="text"
                required
                value={inscriptionData.ifu}
                onChange={(e) => setInscriptionData({...inscriptionData, ifu: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label>Registre de commerce:</label>
              <input
                type="text"
                required
                value={inscriptionData.registre_commerce}
                onChange={(e) => setInscriptionData({...inscriptionData, registre_commerce: e.target.value})}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {loading ? 'Envoi du code OTP...' : '📧 Envoyer le code de vérification'}
            </button>
          </form>
        </div>
      )}

      {/* Étape 2: Vérification OTP */}
      {step === 2 && (
        <div>
          <h2>Étape 2: Vérification du code OTP</h2>
          <p>Un code a été envoyé à: <strong>{inscriptionData.email}</strong></p>
          
          {generatedOTP && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffeaa7',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <strong>Code de développement:</strong> {generatedOTP}
            </div>
          )}

          <form onSubmit={handleValidateOTP}>
            <div style={{ marginBottom: '15px' }}>
              <label>Code OTP reçu:</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '5px',
                  fontSize: '18px',
                  textAlign: 'center',
                  letterSpacing: '8px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                width: '100%'
              }}
            >
              {loading ? 'Vérification...' : '✅ Valider et créer le compte'}
            </button>
          </form>

          <button
            onClick={() => setStep(1)}
            style={{
              padding: '10px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '10px'
            }}
          >
            ← Retour à l'inscription
          </button>
        </div>
      )}

      {/* Étape 3: Succès */}
      {step === 3 && (
        <div style={{ textAlign: 'center' }}>
          <h2>🎉 Compte créé avec succès!</h2>
          <p>Redirection vers le dashboard...</p>
          
          <button
            onClick={handleTestConnexion}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '20px'
            }}
          >
            {loading ? 'Connexion...' : '🔐 Tester la connexion'}
          </button>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>📋 Étapes du test:</h4>
        <ol>
          <li>Remplissez le formulaire d'inscription avec vos informations</li>
          <li>Cliquez sur "Envoyer le code de vérification"</li>
          <li>Vérifiez votre email (ou utilisez le code de développement)</li>
          <li>Entrez le code OTP à 6 chiffres</li>
          <li>Le compte sera créé et vous serez redirigé vers le dashboard</li>
        </ol>
        
        <h4>🔍 Points vérifiés:</h4>
        <ul>
          <li>✅ Génération et envoi du code OTP</li>
          <li>✅ Validation du code OTP</li>
          <li>✅ Création de l'entreprise</li>
          <li>✅ Création de l'utilisateur</li>
          <li>✅ Attribution des permissions</li>
          <li>✅ Connexion et accès au dashboard</li>
        </ul>
      </div>
    </div>
  );
};

export default TestOTP;
