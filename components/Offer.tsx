// The launch offer of a plugin: price, how many launch units are left (the real counter, lib/launch) and what it costs after.
import type { Offer as O } from '@/lib/launch';
import type { UIText } from '@/lib/i18n-ui';

export default function Offer({ price, after, offer, T, children, compact = false }: {
  price: string; after?: string; offer: O | null; T: UIText['offer']; children?: React.ReactNode; compact?: boolean;
}) {
  const launch = !!offer && offer.left > 0;
  return (
    <div className={compact ? 'offer3 compact' : 'offer3'}>
      {launch ? <div className="o-top"><span className="o-badge">{T.launch}</span><span className="o-first">{T.first}</span></div> : null}
      <div className="o-price"><b>{price}</b>{launch && after ? <span>{T.after(after)}</span> : <span>{T.lifetime}</span>}</div>
      {launch && offer ? (
        <>
          <div className="o-meter" role="img" aria-label={T.meter(offer.left, offer.seats)}>
            {Array.from({ length: offer.seats }, (_, i) => <i key={i} data-open={i >= offer.seats - offer.left ? '1' : '0'} />)}
          </div>
          <div className="o-left">{T.left(offer.left)}</div>
        </>
      ) : null}
      {children ? <div className="o-act">{children}</div> : null}
    </div>
  );
}
