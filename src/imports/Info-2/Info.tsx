import svgPaths from "./svg-ts61prv36d";
import imgImage2 from "./bf4b6c133d372168c17299d0b7d46ed18a959143.png";

function Group1() {
  return (
    <div className="absolute contents left-[calc(40%+23px)] top-[708px]">
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[0] left-[calc(40%+23px)] not-italic text-[32px] text-black top-[708px] tracking-[1.6px] whitespace-nowrap">
        <span className="leading-[25px] text-[#00866f]">.</span>
        <span className="leading-[25px] text-[#ff9d0b]">..</span>
      </p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[11.963px] left-[calc(80%-7.78px)] top-[16.11px] w-[66.49px]">
      <div className="absolute inset-[0_-0.26%_0_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66.6611 11.963">
          <g id="Frame 17">
            <path d={svgPaths.p26d17600} fill="var(--fill-0, black)" id="Cellular Connection" />
            <path d={svgPaths.p3b46d180} fill="var(--fill-0, black)" id="Wifi" />
            <g id="Battery">
              <g id="Border" opacity="0.35" />
              <path d={svgPaths.p2ad1ca80} fill="var(--fill-0, #F2F2F2)" id="Cap" opacity="0.4" />
              <rect fill="var(--fill-0, black)" height="7.33333" id="Capacity" rx="1.33333" width="18" x="44.333" y="2" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-[rgba(0,134,111,0)] h-[38px] left-0 top-0 w-[389px]" />
      <Frame />
      <p className="-translate-x-1/2 absolute font-['Open_Sans:Semibold',sans-serif] h-[21.111px] leading-[20px] left-[37.9px] not-italic text-[15px] text-black text-center top-[14px] tracking-[-0.24px] w-[37.903px]">9:41</p>
    </div>
  );
}

export default function Info() {
  return (
    <div className="bg-white relative size-full" data-name="info">
      <div className="absolute bg-[#00866f] h-[534px] left-0 rounded-bl-[195px] top-0 w-[390px]" />
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[30px] left-[18px] not-italic text-[#00866f] text-[24px] top-[575px] whitespace-nowrap">{`Bem-vindo ao BuscaPet `}</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[25px] left-[18px] not-italic text-[#6a6a6a] text-[16px] top-[614px] w-[258px]">Um lugarzinho onde ajudamos você e outras pessoas a encontrar seu amiguinho</p>
      <div className="absolute h-[488px] left-0 rounded-bl-[198px] top-0 w-[391px]" data-name="image 2">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-bl-[198px] size-full" src={imgImage2} />
      </div>
      <Group1 />
      <Group />
    </div>
  );
}