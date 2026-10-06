import type { CUP_GUIDE } from './cupGuide';

/** A small layer/alignment reminder; the actual fold is shown by the 3D paper. */
export function CupCue({ kind }: { kind: (typeof CUP_GUIDE)[number]['cue'] }) {
  return <svg viewBox="0 0 88 64" aria-hidden="true" className="guided-cue" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
    {kind === 'corners' && <><path d="M21 29 44 8 67 29M21 35 44 56 67 35" stroke="#b4bfb1" /><path d="M44 13v14m-5-5 5 5 5-5M44 51V37m-5 5 5-5 5 5" /><circle cx="44" cy="32" r="4" fill="#e5b65a" stroke="none" /></>}
    {kind === 'layers' && <><path d="m13 40 26-23 29 18-27 22Z" fill="#fbfaf7" /><path d="m13 31 26-23 29 18-27 22Z" fill="#eda6a2" /><path d="M73 23h4v24h-4" /><text x="70" y="17" stroke="none" fill="currentColor" fontSize="15" fontWeight="700">2</text></>}
    {(kind === 'front' || kind === 'back') && <><path d="m19 26 25-19 25 19-8 29H27Z" fill="#fbfaf7" stroke="#b4bfb1" /><path d={kind === 'front' ? 'M19 26 44 44 69 26' : 'M19 26 44 7 69 26'} fill="#eda6a2" /><path d={kind === 'front' ? 'M53 16q17 2 9 19m-4-3 4 3 4-2' : 'M54 7q19 6 12 20m-4-3 4 3 4-2'} /><text x="10" y="18" stroke="none" fill="currentColor" fontSize="15" fontWeight="700">1</text></>}
    {kind === 'gentle' && <><path d="M26 21h36l-6 32H32Z" fill="#eda6a2" /><ellipse cx="44" cy="21" rx="18" ry="5" fill="#fbfaf7" /><path d="M8 34h14m-5-5 5 5-5 5M80 34H66m5-5-5 5 5 5" /></>}
  </svg>;
}
