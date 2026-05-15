import svgPaths from "./svg-zam4socb4c";
import imgImage2 from "./943b4b2c5d53955196474d30b2a59211bd9514c9.png";

function Group1() {
  return (
    <div className="absolute contents left-[calc(40%+26px)] top-[686px]">
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[0] left-[calc(40%+26px)] not-italic text-[32px] text-black top-[686px] tracking-[1.6px] whitespace-nowrap">
        <span className="leading-[25px] text-[#00866f]">.</span>
        <span className="leading-[25px] text-[#ff9d0b]">..</span>
      </p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[11.963px] left-[calc(80%-6.78px)] top-[16.11px] w-[66.49px]">
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
    <div className="absolute contents left-px top-0">
      <div className="absolute bg-[rgba(0,134,111,0)] h-[38px] left-px top-0 w-[389px]" />
      <Frame />
      <p className="-translate-x-1/2 absolute font-['Open_Sans:Semibold',sans-serif] h-[21.111px] leading-[20px] left-[38.9px] not-italic text-[15px] text-black text-center top-[14px] tracking-[-0.24px] w-[37.903px]">9:41</p>
    </div>
  );
}

export default function Info() {
  return (
    <div className="bg-white relative size-full" data-name="info2">
      <div className="absolute bg-[#00866f] h-[534px] left-0 rounded-bl-[195px] top-0 w-[390px]" />
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[30px] left-[17px] not-italic text-[#00866f] text-[24px] top-[571px] w-[184px]">Adote um pet</p>
      <div className="absolute h-[491px] left-[-2px] rounded-bl-[198px] top-0 w-[393px]" data-name="image 2">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-bl-[198px] size-full" src={imgImage2} />
      </div>
      <Group1 />
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[30px] left-[17px] not-italic text-[#6a6a6a] text-[16px] top-[609px] w-[310px]">Aqui também ajudamos a você adotar um amiguinho</p>
      <Group />
    </div>
  );
}