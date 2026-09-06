import { RichText, type RichTextInterface } from '@remnote/plugin-sdk';
import { splitRepeatContent } from '../services/repeatContent';
import { RepeatMedia } from './RepeatMedia';

export type RepeatRichTextContentProps = {
  content: RichTextInterface;
};

export function RepeatRichTextContent({
  content,
}: RepeatRichTextContentProps): JSX.Element {
  return (
    <div className="signal-repeat-rich-text">
      {splitRepeatContent(content).map((part, index) => {
        if (part.kind === 'rich-text') {
          return (
            <RichText
              key={`rich-text-${index}`}
              text={part.content}
              width="100%"
            />
          );
        }

        return <RepeatMedia key={`media-${index}`} media={part.media} />;
      })}
    </div>
  );
}
