import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Shield,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { otp } from "../../config/supabase";

const OTPVerification = ({
  email,
  onVerificationSuccess,
  onBack,
  isLoading = false,
}) => {
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes en secondes
  const [isExpired, setIsExpired] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Timer pour l'expiration du code
  useEffect(() => {
    if (timeLeft > 0 && !isExpired && !isBlocked) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isExpired) {
      setIsExpired(true);
      setError("Le code a expiré. Veuillez demander un nouveau code.");
    }
  }, [timeLeft, isExpired, isBlocked]);

  // Timer pour le cooldown de renvoi
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  // Formatter le temps restant
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Gérer la saisie du code OTP
  const handleOtpChange = (index, value) => {
    // N'accepter que les chiffres
    const numValue = value.replace(/[^0-9]/g, "");

    if (numValue.length <= 1) {
      const newOtpCode = [...otpCode];
      newOtpCode[index] = numValue;
      setOtpCode(newOtpCode);
      setError("");

      // Passer automatiquement au champ suivant
      if (numValue && index < 7) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Gérer le collage
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");

    if (pastedData.length === 8) {
      const newOtpCode = pastedData.split("");
      setOtpCode(newOtpCode);
      setError("");
      inputRefs.current[7]?.focus();
    }
  };

  // Gérer la touche Retour arrière
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Valider le code OTP
  const handleVerify = async () => {
    const code = otpCode.join("");

    if (code.length !== 8) {
      setError("Veuillez entrer les 8 chiffres du code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const result = await otp.validateOTP(email, code);

      if (result.success) {
        setSuccess("Code validé avec succès!");
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setError(result.message);
        setAttemptsRemaining(result.attemptsRemaining || 0);

        if (result.blockedUntil) {
          setIsBlocked(true);
          setBlockedUntil(result.blockedUntil);
        }
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Renvoyer le code OTP
  const handleResend = async () => {
    if (!canResend || resendCooldown > 0) return;

    try {
      // Vérifier si on peut demander un nouveau code
      const canRequest = await otp.canRequestOTP(email);

      if (!canRequest.canRequest) {
        setError(canRequest.message);
        if (canRequest.waitTime > 0) {
          setResendCooldown(canRequest.waitTime);
        }
        return;
      }

      // Générer un nouveau code
      const result = await otp.generateOTP(email);

      if (result.success) {
        // Réinitialiser l'état
        setOtpCode(["", "", "", "", "", "", "", ""]);
        setTimeLeft(300);
        setIsExpired(false);
        setAttemptsRemaining(3);
        setIsBlocked(false);
        setBlockedUntil(null);
        setCanResend(false);
        setResendCooldown(30);
        setError("");
        setSuccess("Nouveau code envoyé avec succès!");

        // Envoyer l'email
        await otp.sendEmailOTP(email, result.otpCode);

        // En développement, afficher le code dans la console
        if (import.meta.env.DEV && result.otpCode) {
          console.log(`Nouveau code OTP pour ${email}: ${result.otpCode}`);
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError("Impossible de renvoyer le code. Veuillez réessayer.");
    }
  };

  // Vérifier si le formulaire est complet
  const isCodeComplete = otpCode.every((digit) => digit !== "");

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-gray-300 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Shield className="h-8 w-8 text-gray-900" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vérification par email
        </h2>
        <p className="text-gray-600">Un code à 8 chiffres a été envoyé à</p>
        <p className="font-medium text-gray-900 mt-1">{email}</p>
      </div>

      {/* Timer */}
      {!isExpired && !isBlocked && (
        <div className="flex items-center justify-center mb-6">
          <Clock className="h-5 w-5 text-gray-500 mr-2" />
          <span
            className={`text-sm font-medium ${
              timeLeft < 60 ? "text-gray-900" : "text-gray-600"
            }`}
          >
            Expire dans {formatTime(timeLeft)}
          </span>
        </div>
      )}

      {/* Message de blocage */}
      {isBlocked && blockedUntil && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-900 mr-2" />
            <span className="text-gray-900 text-sm">
              Compte bloqué. Réessayez dans{" "}
              {formatTime(
                Math.floor((new Date(blockedUntil) - new Date()) / 1000),
              )}
            </span>
          </div>
        </div>
      )}

      {/* Messages d'erreur et de succès */}
      {error && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-900 mr-2" />
            <span className="text-gray-900 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-gray-900 mr-2" />
            <span className="text-gray-900 text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Champs de saisie OTP */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Code de vérification
        </label>
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otpCode.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-10 h-12 text-center text-lg font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors ${
                error ? "border-gray-900" : "border-gray-300"
              } ${digit ? "bg-gray-100" : "bg-white"}`}
              disabled={isVerifying || isBlocked || isLoading}
            />
          ))}
        </div>
        {attemptsRemaining > 0 && !isBlocked && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            {attemptsRemaining} tentative{attemptsRemaining > 1 ? "s" : ""}{" "}
            restante{attemptsRemaining > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Boutons */}
      <div className="space-y-3">
        <button
          onClick={handleVerify}
          disabled={!isCodeComplete || isVerifying || isBlocked || isLoading}
          className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Vérification en cours...
            </span>
          ) : (
            "Vérifier le code"
          )}
        </button>

        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
          >
            Retour
          </button>

          <button
            onClick={handleResend}
            disabled={
              !canResend || resendCooldown > 0 || isBlocked || isLoading
            }
            className="flex items-center text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${resendCooldown > 0 ? "animate-spin" : ""}`}
            />
            {resendCooldown > 0
              ? `Renvoyer (${resendCooldown}s)`
              : "Renvoyer le code"}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <div className="flex items-start space-x-3">
          <Mail className="h-5 w-5 text-gray-900 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              Instructions :
            </h4>
            <ul className="text-gray-700 text-xs space-y-1">
              <li>• Vérifiez votre boîte de réception et vos spams</li>
              <li>• Le code expire après 5 minutes</li>
              <li>• 3 tentatives maximum avant blocage de 2 minutes</li>
              {import.meta.env.DEV && (
                <li className="text-gray-900">
                  • Mode DEV: Le code s'affiche dans la console
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
