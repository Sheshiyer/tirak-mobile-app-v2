import React, {useRef, useState} from 'react';
import {Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import {designTokens} from '@/constants/design-tokens';

export const ACCOUNT_CLOSURE_MESSAGE = 'Close your account and disable sign-in. Booking and message history may be retained for records and safety.';

export function AccountClosureConfirmation({visible, onClose, onConfirm}: {
  visible: boolean; onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!pending.current) { setError(''); onClose(); } };
  const confirm = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError('');
    try { await onConfirm(); onClose(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to close your account. Please try again.'); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityViewIsModal>
        <Text accessibilityRole="header" style={styles.title}>Close account?</Text>
        <Text style={styles.body}>{ACCOUNT_CLOSURE_MESSAGE}</Text>
        {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.error}>{error}</Text> : null}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Keep account" accessibilityState={{disabled:busy}} disabled={busy} onPress={close} style={styles.keep}>
          <Text style={styles.keepText}>Keep account</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Confirm close account" accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={confirm} style={styles.confirm}>
          {busy ? <ActivityIndicator color="#fff" accessibilityLabel="Closing account"/> : <Text style={styles.confirmText}>Confirm close account</Text>}
        </TouchableOpacity>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center',padding:16},
  card:{width:'100%',maxWidth:440,backgroundColor:designTokens.colors.semantic.surface,borderRadius:20,padding:24,gap:16},
  title:{fontSize:22,fontWeight:'700',color:designTokens.colors.semantic.text},
  body:{fontSize:16,lineHeight:24,color:designTokens.colors.semantic.textSecondary},
  error:{fontSize:14,lineHeight:20,color:designTokens.colors.semantic.error},
  keep:{minHeight:48,padding:12,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:1,borderColor:designTokens.colors.semantic.textSecondary},
  keepText:{fontSize:16,fontWeight:'600',color:designTokens.colors.semantic.text},
  confirm:{minHeight:48,padding:12,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:designTokens.colors.semantic.error},
  confirmText:{fontSize:16,fontWeight:'600',color:'#fff',textAlign:'center'},
});
