import React from "react";
import Menu from "../../components/menu";
import SideMenu from "../../components/sideMenu";
import Orb from "../../components/UI/Orb";
import AssistantInput from "../../components/assistantInput";

export default function TeacherAssistant() {


    return (

        <>

            {/* Orb Background */}
            <div className="fixed inset-0 w-full h-full -z-10 bg-gradient-to-br from-[#F3ebff] via-[#fff1e7] to-[#e6f4ff]">
                <div className="w-full h-full opacity-60">
                    <Orb hoverIntensity={2} rotateOnHover={true} hue={0} forceHoverState={false} backgroundColor="#F3ebff" />
                </div>
            </div>

            <div className="flex flex-col h-[calc(100vh-10rem)] text-black w-full relative">
                <Menu />
                <SideMenu />

                <div className="flex w-full flex-col z-10 h-full pb-4">
                    <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                        <h2 className="text-4xl font-bold font-['Gabarito'] text-[#3C0078]">Hi Rikus,</h2>
                        <h2 className="text-5xl font-bold font-['Gabarito'] text-slate-800 mb-8">Where should we start?</h2>
                    </div>

                    {/* Input attached to the bottom */}
                    <div className="w-full flex justify-center mt-auto">
                        <AssistantInput />
                    </div>
                </div>
            </div>
        </>
    )
}
