import svgPaths from "./svg-tk4rbstejt";

function Frame1() {
  return (
    <div className="absolute gap-x-[40px] gap-y-[48px] grid grid-cols-[repeat(1,minmax(0,1fr))] grid-rows-[repeat(2,minmax(0,1fr))] h-[122px] left-[17px] rounded-[8px] top-[198px] w-[355px]">
      <div className="bg-white col-1 h-[48px] justify-self-stretch relative rounded-[10px] row-2 shrink-0">
        <div aria-hidden="true" className="absolute border border-[#b1b0b0] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      <div className="bg-white col-1 h-[48px] justify-self-stretch relative rounded-[10px] row-1 shrink-0">
        <div aria-hidden="true" className="absolute border border-[#b1b0b0] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute gap-x-[40px] gap-y-[40px] grid grid-cols-[repeat(1,minmax(0,1fr))] grid-rows-[repeat(2,minmax(0,1fr))] h-[128px] left-[17px] rounded-[8px] top-[366px] w-[355px]">
      <div className="bg-white col-1 h-[48px] justify-self-stretch relative rounded-[10px] row-1 shrink-0">
        <div aria-hidden="true" className="absolute border border-[#b1b0b0] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      <div className="bg-white col-1 h-[48px] justify-self-stretch relative rounded-[10px] row-2 shrink-0">
        <div aria-hidden="true" className="absolute border border-[#b1b0b0] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute h-[11.963px] left-[calc(80%-7px)] top-[16.11px] w-[66.661px]">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 66.6611 11.963">
        <g id="Frame 17">
          <rect fill="white" height="11.963" width="66.6611" />
          <path d={svgPaths.p26d17600} fill="var(--fill-0, black)" id="Cellular Connection" />
          <path d={svgPaths.p3b46d180} fill="var(--fill-0, black)" id="Wifi" />
          <g id="Battery">
            <rect height="10.3333" id="Border" opacity="0.35" rx="2.16667" stroke="var(--stroke-0, white)" width="21" x="42.833" y="0.5" />
            <path d={svgPaths.p2ad1ca80} fill="var(--fill-0, #F2F2F2)" id="Cap" opacity="0.4" />
            <rect fill="var(--fill-0, black)" height="7.33333" id="Capacity" rx="1.33333" width="18" x="44.333" y="2" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute contents left-0 top-0">
      <div className="absolute bg-white h-[38px] left-0 top-0 w-[390px]" />
      <Frame />
      <p className="-translate-x-1/2 absolute font-['Open_Sans:Semibold',sans-serif] h-[21.111px] leading-[20px] left-[38px] not-italic text-[15px] text-black text-center top-[14px] tracking-[-0.24px] w-[38px]">9:41</p>
    </div>
  );
}

export default function Registro() {
  return (
    <div className="bg-white relative size-full" data-name="registro">
      <p className="absolute font-['General_Sans:Bold',sans-serif] leading-[50px] left-[calc(20%+54px)] not-italic text-[30px] text-black top-[97px] whitespace-nowrap">Registro</p>
      <Frame1 />
      <Frame2 />
      <div className="absolute bg-white border border-[#b1b0b0] border-solid h-[48px] left-[17px] rounded-[8px] top-[538px] w-[355px]" />
      <div className="absolute bg-white border border-[#b1b0b0] border-solid h-[48px] left-[17px] rounded-[8px] top-[626px] w-[355px]" />
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[161px] w-[115px]">Nome completo</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[331px] w-[115px]">Cidade</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[249px] w-[115px]">Email</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[415px] w-[115px]">Telefone</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[503px] w-[115px]">Senha</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[17px] not-italic text-[14px] text-black top-[591px] w-[115px]">Confirmar senha</p>
      <div className="absolute flex h-[48px] items-center justify-center left-[17px] top-[717px] w-[355px]">
        <div className="-scale-y-100 flex-none">
          <div className="bg-[#00866f] h-[48px] relative rounded-[8px] w-[355px]" />
        </div>
      </div>
      <p className="absolute font-['General_Sans:Bold',sans-serif] leading-[50px] left-[calc(40%-5px)] not-italic text-[16px] text-white top-[717px] whitespace-nowrap">Criar conta</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[calc(20%+30px)] not-italic text-[#757575] text-[16px] top-[765px] whitespace-nowrap">Ja tenho conta?</p>
      <p className="absolute font-['General_Sans:Semibold',sans-serif] leading-[50px] left-[calc(60%+5px)] not-italic text-[#1c5cb5] text-[16px] top-[765px] whitespace-nowrap">Login</p>
      <div className="absolute h-0 left-[calc(60%+6px)] top-[798px] w-[40px]">
        <div className="absolute inset-[-1px_0_0_0]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 1">
            <line id="Line 19" stroke="var(--stroke-0, #5990DE)" x2="40" y1="0.5" y2="0.5" />
          </svg>
        </div>
      </div>
      <Group />
    </div>
  );
}