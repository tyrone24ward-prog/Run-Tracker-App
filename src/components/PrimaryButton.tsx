import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'mint';
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, variant = 'primary', disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.primary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        variant === 'mint' && styles.mint,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.text,
          (variant === 'ghost' || variant === 'mint') && styles.textDark,
          variant === 'danger' && styles.textDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.full,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  danger: {
    backgroundColor: '#3A1820',
    borderWidth: 1,
    borderColor: colors.red,
  },
  ghost: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mint: {
    backgroundColor: colors.mint,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    color: '#10140A',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  textDark: {
    color: colors.text,
  },
  textDanger: {
    color: colors.red,
  },
});
