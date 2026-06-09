import os
import json
import random
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def run_draft_agent(exam_type: str, subject: str, difficulty: str, q_type: str, language: str = "English") -> dict:
    """
    Agent A: Question drafting agent.
    Generates a question matching specifications.
    """
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
    
    if api_key:
        try:
            # Implement real LangChain ChatOpenAI/ChatAnthropic here
            # For brevity and environment independence, we'll run the prompt structure
            from langchain_openai import ChatOpenAI
            model = ChatOpenAI(model="gpt-4o", temperature=0.7)
            
            prompt = ChatPromptTemplate.from_template(
                "You are an expert exam setter for {exam_type}. "
                "Draft a highly challenging, non-plagiarized question in {language}.\n"
                "Subject: {subject}\n"
                "Difficulty: {difficulty}\n"
                "Question Type: {q_type}\n"
                "Provide the response as valid JSON matching this schema:\n"
                "{{\n"
                "  \"text_json\": {{\"en\": \"Question text\", \"hi\": \"Hindi translation (optional)\"}},\n"
                "  \"options_json\": {{\"en\": {{\"A\": \"\", \"B\": \"\", \"C\": \"\", \"D\": \"\"}}}},\n"
                "  \"answer\": \"Correct option letter (e.g. B)\",\n"
                "  \"explanation\": \"Detailed logic explanation\"\n"
                "}}"
            )
            chain = prompt | model | JsonOutputParser()
            res = chain.invoke({
                "exam_type": exam_type,
                "subject": subject,
                "difficulty": difficulty,
                "q_type": q_type,
                "language": language
            })
            return res
        except Exception as e:
            print(f"Draft Agent API call failed: {e}. Falling back to simulation.")

    # High-quality offline question templates pool
    pool = {
        "Biology": [
            {
                "text_json": {
                    "en": "Analyze the ribosomal subunit configuration during eukaryotic translation initiation phase.",
                    "hi": "यूकेरियोटिक अनुवाद दीक्षा चरण के दौरान राइबोसोमल सबयूनिट कॉन्फ़िगरेशन का विश्लेषण करें।"
                },
                "options_json": {
                    "en": {
                        "A": "40S and 60S subunit scanning",
                        "B": "30S and 50S prokaryotic binding",
                        "C": "80S direct initiation bypass",
                        "D": "70S mono-cistronic translation"
                    },
                    "hi": {
                        "A": "40S और 60S सबयूनिट स्कैनिंग",
                        "B": "30S और 50S प्रोकैरियोटिक बंधन",
                        "C": "80S प्रत्यक्ष दीक्षा बाईपास",
                        "D": "70S मोनो-सिस्ट्रोनिक अनुवाद"
                    }
                },
                "answer": "A",
                "explanation": "In eukaryotic translation, the 40S ribosomal subunit binds the mRNA at the 5' cap and scans for the initiation codon before the 60S subunit joins to form the 80S ribosome."
            },
            {
                "text_json": {
                    "en": "Which enzyme is responsible for unwinding the DNA double helix during replication, and what mechanism does it use to relieve torsional stress ahead of the replication fork?",
                    "hi": "रेप्लिकेशन के दौरान डीएनए डबल हेलिक्स को खोलने के लिए कौन सा एंजाइम जिम्मेदार है, और यह तनाव दूर करने के लिए किस तंत्र का उपयोग करता है?"
                },
                "options_json": {
                    "en": {
                        "A": "Primase — nucleotide addition",
                        "B": "Helicase + Topoisomerase II",
                        "C": "DNA Polymerase I — repair",
                        "D": "Ligase — strand joining"
                    },
                    "hi": {
                        "A": "प्राइमेज़ — न्यूक्लियोटाइड जोड़",
                        "B": "हेलीकेस + टोपोइसोमेरेज़ II",
                        "C": "डीएनए पोलीमरेज़ I — मरम्मत",
                        "D": "लिगेज — किनारा जोड़"
                    }
                },
                "answer": "B",
                "explanation": "Helicase unwinds the double helix, while Topoisomerase II (DNA gyrase) cuts and reseals DNA strands to relieve supercoiling tension."
            }
        ],
        "Physics": [
            {
                "text_json": {
                    "en": "Calculate the magnetic flux density at the center of a circular current carrying loop of radius R and current I.",
                    "hi": "आर त्रिज्या और आई करंट के गोलाकार करंट ले जाने वाले लूप के केंद्र में चुंबकीय प्रवाह घनत्व की गणना करें।"
                },
                "options_json": {
                    "en": {
                        "A": "μ0 I / (2R)",
                        "B": "μ0 I / (4πR)",
                        "C": "μ0 I R^2",
                        "D": "Zero"
                    },
                    "hi": {
                        "A": "μ0 I / (2R)",
                        "B": "μ0 I / (4πR)",
                        "C": "μ0 I R^2",
                        "D": "शून्य"
                    }
                },
                "answer": "A",
                "explanation": "B = μ0 I / (2R) is derived from Biot-Savart law at the center of a circular current loop."
            }
        ],
        "Chemistry": [
            {
                "text_json": {
                    "en": "Identify the major product formed when toluene is treated with chlorine in the presence of FeCl3.",
                    "hi": "FeCl3 की उपस्थिति में टोल्यूनि को क्लोरीन के साथ उपचारित करने पर बनने वाले मुख्य उत्पाद की पहचान करें।"
                },
                "options_json": {
                    "en": {
                        "A": "o- and p-chlorotoluene",
                        "B": "m-chlorotoluene",
                        "C": "Benzyl chloride",
                        "D": "Benzal chloride"
                    },
                    "hi": {
                        "A": "ओ- और पी-क्लोरोटोल्यूनि",
                        "B": "एम-क्लोरोटोल्यूनि",
                        "C": "बेंजाइल क्लोराइड",
                        "D": "बेंजाल क्लोराइड"
                    }
                },
                "answer": "A",
                "explanation": "FeCl3 acts as a Lewis acid catalyst for electrophilic aromatic substitution, directing chlorine to ortho and para positions of the methyl group on toluene."
            }
        ]
    }

    # Fallback to general reasoning/civils templates if subject not matched
    subj_pool = pool.get(subject, [
        {
            "text_json": {
                "en": f"Analyze the core impact of regulatory directives on {subject} development inside standard administrative guidelines.",
                "hi": f"मानक प्रशासनिक दिशानिर्देशों के भीतर {subject} विकास पर नियामक निर्देशों के मुख्य प्रभाव का विश्लेषण करें।"
            },
            "options_json": {
                "en": {
                    "A": "Decentralized autonomous execution",
                    "B": "Centralized oversight enforcement",
                    "C": "Ad-hoc compliance bypass",
                    "D": "Sovereign policy suspension"
                },
                "hi": {
                    "A": "विकेंद्रीकृत स्वायत्त निष्पादन",
                    "B": "केंद्रीकृत निगरानी प्रवर्तन",
                    "C": "तदर्थ अनुपालन बाईपास",
                    "D": "संप्रभु नीति निलंबन"
                }
            },
            "answer": "B",
            "explanation": "Regulatory frameworks traditionally rely on centralized administrative agencies to oversee and enforce legal compliance mandates."
        }
    ])
    
    return random.choice(subj_pool)
