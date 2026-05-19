import React, { memo } from 'react';
import EmojiKeyboard from './EmojiKeyboard';

// Re-export the new EmojiKeyboard component for backward compatibility
const YambiEmojiKeyboard = () => {
  return <EmojiKeyboard height={300} />;
};

export default memo(YambiEmojiKeyboard);
