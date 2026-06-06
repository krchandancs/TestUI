import { useState } from 'react';

const PREF_KEY = 'ps_post_signout_pref';

export function useSynopticFinalize() {
  const [showFinalizeModal,    setShowFinalizeModal]    = useState(false);
  const [finalizeAndNext,      setFinalizeAndNext]      = useState(false);
  const [finalizePassword,     setFinalizePassword]     = useState('');
  const [finalizeError,        setFinalizeError]        = useState('');
  const [showSignOutModal,     setShowSignOutModal]     = useState(false);
  const [signOutUser,          setSignOutUser]          = useState('');
  const [signOutPassword,      setSignOutPassword]      = useState('');
  const [signOutError,         setSignOutError]         = useState('');
  const [caseSigned,           setCaseSigned]           = useState(false);
  const [showPostSignOutModal, setShowPostSignOutModal] = useState(false);
  const [postSignOutPref,      setPostSignOutPref]      = useState<'next' | 'worklist'>(
    () => (localStorage.getItem(PREF_KEY) as 'next' | 'worklist' | null) ?? 'next'
  );
  const [showAmendmentModal,   setShowAmendmentModal]   = useState(false);
  const [amendmentText,        setAmendmentText]        = useState('');
  const [amendmentMode,        setAmendmentMode]        = useState<'amendment' | 'addendum'>('amendment');

  return {
    showFinalizeModal,    setShowFinalizeModal,
    finalizeAndNext,      setFinalizeAndNext,
    finalizePassword,     setFinalizePassword,
    finalizeError,        setFinalizeError,
    showSignOutModal,     setShowSignOutModal,
    signOutUser,          setSignOutUser,
    signOutPassword,      setSignOutPassword,
    signOutError,         setSignOutError,
    caseSigned,           setCaseSigned,
    showPostSignOutModal, setShowPostSignOutModal,
    postSignOutPref,      setPostSignOutPref,
    showAmendmentModal,   setShowAmendmentModal,
    amendmentText,        setAmendmentText,
    amendmentMode,        setAmendmentMode,
  };
}
