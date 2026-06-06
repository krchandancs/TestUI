/**
 * BiometricSetupWizard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * First-login biometric enrolment wizard.
 * Triggered by AuthContext when shouldShowBiometricWizard() returns true.
 * Three steps: welcome → device check → enrol.
 * Dismissible ("set up later") — re-prompts after 3 dismissals.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import '@/pathscribe.css';
import {
  isBiometricAvailable,
  enrollBiometric,
  dismissBiometricWizard,
  getDeviceName,
} from '@/services/biometric/mockBiometricService';

interface Props {
  userId:     string;
  userName:   string;
  onComplete: () => void;
  onDismiss:  () => void;
}

type Step = 'welcome' | 'checking' | 'unavailable' | 'enrol' | 'enrolling' | 'done' | 'error';

// ─── Step content ──────────────────────────────────────────────────────────────

const BiometricSetupWizard: React.FC<Props> = ({ userId, userName, onComplete, onDismiss }) => {
  const [step,       setStep]       = React.useState<Step>('welcome');
  const [deviceName, setDeviceName] = React.useState('biometric');
  const [errorMsg,   setErrorMsg]   = React.useState('');

  const startCheck = async () => {
    setStep('checking');
    const available = await isBiometricAvailable();
    if (available) {
      setDeviceName(getDeviceName());
      setStep('enrol');
    } else {
      setStep('unavailable');
    }
  };

  const handleEnrol = async () => {
    setStep('enrolling');
    const result = await enrollBiometric(userId);
    if (result.ok) {
      setStep('done');
    } else {
      setErrorMsg(result.error ?? 'Enrolment failed. Please try again.');
      setStep('error');
    }
  };

  const handleDismiss = () => {
    dismissBiometricWizard(userId);
    onDismiss();
  };

  return (
    <div className="ps-overlay" onClick={e => e.stopPropagation()}>
      <div className="ps-modal-dark">

        {/* ── Welcome ─────────────────────────────────────────── */}
        {step === 'welcome' && <>
          <div className="ps-bio-icon-box">🔐</div>
          <h2 className="ps-modal-dark-title">Set up biometric sign-off</h2>
          <p className="ps-modal-dark-body">
            Hi {userName}. PathScribe can use {getDeviceName()} to verify your
            identity when finalising reports — replacing your password for a
            faster, more secure workflow.
          </p>
          <p className="ps-modal-dark-hint">
            Your biometric data never leaves your device. PathScribe stores only
            a cryptographic reference, which satisfies 21 CFR Part 11
            e-signature requirements.
          </p>
          <div className="ps-modal-dark-footer">
            <button className="ps-btn-ghost-dark" onClick={handleDismiss}>Set up later</button>
            <button className="ps-btn-primary"    onClick={startCheck}>Set up now</button>
          </div>
        </>}

        {/* ── Checking ────────────────────────────────────────── */}
        {step === 'checking' && <>
          <div className="ps-bio-icon-box">⏳</div>
          <h2 className="ps-modal-dark-title">Checking your device…</h2>
          <p className="ps-modal-dark-body">Detecting available authenticators.</p>
        </>}

        {/* ── Unavailable ─────────────────────────────────────── */}
        {step === 'unavailable' && <>
          <div className="ps-bio-icon-box">⚠️</div>
          <h2 className="ps-modal-dark-title">Not available on this device</h2>
          <p className="ps-modal-dark-body">
            Your device doesn't support platform biometric authentication. You
            can continue using your password to sign off reports.
          </p>
          <p className="ps-modal-dark-hint">
            If you switch to a device with Touch ID, Face ID, or Windows Hello,
            you can set this up from Profile settings.
          </p>
          <div className="ps-modal-dark-footer">
            <button className="ps-btn-primary" onClick={onComplete}>Continue with password</button>
          </div>
        </>}

        {/* ── Enrol ───────────────────────────────────────────── */}
        {step === 'enrol' && <>
          <div className="ps-bio-icon-box">👆</div>
          <h2 className="ps-modal-dark-title">Register {deviceName}</h2>
          <p className="ps-modal-dark-body">
            Click the button below. Your browser will prompt you to authenticate
            with {deviceName}. This registers your credential with PathScribe —
            you won't need your password to finalise reports after this.
          </p>
          <div className="ps-modal-dark-footer">
            <button className="ps-btn-ghost-dark" onClick={handleDismiss}>Skip for now</button>
            <button className="ps-btn-primary"    onClick={handleEnrol}>Register {deviceName}</button>
          </div>
        </>}

        {/* ── Enrolling ───────────────────────────────────────── */}
        {step === 'enrolling' && <>
          <div className="ps-bio-icon-box">⏳</div>
          <h2 className="ps-modal-dark-title">Waiting for {deviceName}…</h2>
          <p className="ps-modal-dark-body">
            Follow the prompt on your device to complete registration.
          </p>
        </>}

        {/* ── Done ────────────────────────────────────────────── */}
        {step === 'done' && <>
          <div className="ps-bio-icon-box">✅</div>
          <h2 className="ps-modal-dark-title">You're set up</h2>
          <p className="ps-modal-dark-body">
            {deviceName} is now registered. From now on, when you finalise a
            report you'll see a biometric option alongside the password field.
          </p>
          <p className="ps-modal-dark-hint">
            You can manage this from <strong>Profile → Security</strong> at any time.
          </p>
          <div className="ps-modal-dark-footer">
            <button className="ps-btn-primary" onClick={onComplete}>Done</button>
          </div>
        </>}

        {/* ── Error ───────────────────────────────────────────── */}
        {step === 'error' && <>
          <div className="ps-bio-icon-box">❌</div>
          <h2 className="ps-modal-dark-title">Enrolment failed</h2>
          <p className="ps-modal-dark-body">{errorMsg}</p>
          <div className="ps-modal-dark-footer">
            <button className="ps-btn-ghost-dark" onClick={handleDismiss}>Skip for now</button>
            <button className="ps-btn-primary"    onClick={() => setStep('enrol')}>Try again</button>
          </div>
        </>}

      </div>
    </div>
  );
};

export default BiometricSetupWizard;
