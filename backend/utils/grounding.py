import re
from typing import Dict, List

# Grounding contexts mapping keywords to empirical/researched facts.
# These will be injected into persona prompts based on the debate topic.
GROUNDING_DATABASE: Dict[str, str] = {
    "education": (
        "According to educational research: "
        "1. Active learning and peer collaboration in physical spaces lead to a 1.5x increase in concept retention compared to passive learning. "
        "2. The student-teacher relationship is the single largest school-level factor affecting student academic growth (accounting for up to 30% of variance). "
        "3. Adaptive learning software has been shown to improve mathematics performance by up to 0.35 standard deviations when integrated as a supplement, but not as a replacement."
    ),
    "teacher": (
        "According to educational research: "
        "1. Active learning and peer collaboration in physical spaces lead to a 1.5x increase in concept retention compared to passive learning. "
        "2. The student-teacher relationship is the single largest school-level factor affecting student academic growth (accounting for up to 30% of variance). "
        "3. Adaptive learning software has been shown to improve mathematics performance by up to 0.35 standard deviations when integrated as a supplement, but not as a replacement."
    ),
    "classroom": (
        "According to educational research: "
        "1. Active learning and peer collaboration in physical spaces lead to a 1.5x increase in concept retention compared to passive learning. "
        "2. The student-teacher relationship is the single largest school-level factor affecting student academic growth (accounting for up to 30% of variance). "
        "3. Adaptive learning software has been shown to improve mathematics performance by up to 0.35 standard deviations when integrated as a supplement, but not as a replacement."
    ),
    "school": (
        "According to educational research: "
        "1. Active learning and peer collaboration in physical spaces lead to a 1.5x increase in concept retention compared to passive learning. "
        "2. The student-teacher relationship is the single largest school-level factor affecting student academic growth (accounting for up to 30% of variance). "
        "3. Adaptive learning software has been shown to improve mathematics performance by up to 0.35 standard deviations when integrated as a supplement, but not as a replacement."
    ),
    "social media": (
        "Studies on digital habits indicate: "
        "1. A 2023 Pew Research study showed that 59% of teens feel social media makes them feel more connected to their friends' lives, while 38% feel overwhelmed by the drama on these platforms. "
        "2. Longitudinal studies associate daily screen time exceeding 3 hours on social networking platforms with a 2x increase in the risk of experiencing poor mental health outcomes. "
        "3. Algorithms optimized for high emotional arousal (outrage, fear) experience a 70% higher rate of amplification compared to neutral content."
    ),
    "screen": (
        "Studies on digital habits indicate: "
        "1. A 2023 Pew Research study showed that 59% of teens feel social media makes them feel more connected to their friends' lives, while 38% feel overwhelmed by the drama on these platforms. "
        "2. Longitudinal studies associate daily screen time exceeding 3 hours on social networking platforms with a 2x increase in the risk of experiencing poor mental health outcomes. "
        "3. Algorithms optimized for high emotional arousal (outrage, fear) experience a 70% higher rate of amplification compared to neutral content."
    ),
    "remote work": (
        "Economic and organizational research shows: "
        "1. A Stanford study of 16,000 workers found that remote work increased productivity by 13%, driven by a quieter working environment and fewer commute hours. "
        "2. However, fully remote firms report a 20-25% reduction in cross-departmental collaboration and creative patent generation compared to hybrid or fully in-person firms. "
        "3. Remote workers save an average of 8.5 hours per week on commuting, which correlates with improved overall sleep quality and personal wellness."
    ),
    "work from home": (
        "Economic and organizational research shows: "
        "1. A Stanford study of 16,000 workers found that remote work increased productivity by 13%, driven by a quieter working environment and fewer commute hours. "
        "2. However, fully remote firms report a 20-25% reduction in cross-departmental collaboration and creative patent generation compared to hybrid or fully in-person firms. "
        "3. Remote workers save an average of 8.5 hours per week on commuting, which correlates with improved overall sleep quality and personal wellness."
    ),
    "office": (
        "Economic and organizational research shows: "
        "1. A Stanford study of 16,000 workers found that remote work increased productivity by 13%, driven by a quieter working environment and fewer commute hours. "
        "2. However, fully remote firms report a 20-25% reduction in cross-departmental collaboration and creative patent generation compared to hybrid or fully in-person firms. "
        "3. Remote workers save an average of 8.5 hours per week on commuting, which correlates with improved overall sleep quality and personal wellness."
    ),
    "art": (
        "Legal and creative sector analysis reveals: "
        "1. The US Copyright Office has affirmed that copyright protection requires 'human authorship', meaning fully AI-generated works without substantial human control are not registerable. "
        "2. Over 75% of digital illustrators surveyed report concerns about intellectual property theft, while 68% have experimented with integrating AI generators into their workflow for ideation. "
        "3. Historically, technological disruptions in art (such as photography in the 19th century) initially faced legal and aesthetic pushback before becoming established creative mediums."
    ),
    "copyright": (
        "Legal and creative sector analysis reveals: "
        "1. The US Copyright Office has affirmed that copyright protection requires 'human authorship', meaning fully AI-generated works without substantial human control are not registerable. "
        "2. Over 75% of digital illustrators surveyed report concerns about intellectual property theft, while 68% have experimented with integrating AI generators into their workflow for ideation. "
        "3. Historically, technological disruptions in art (such as photography in the 19th century) initially faced legal and aesthetic pushback before becoming established creative mediums."
    ),
    "creative": (
        "Legal and creative sector analysis reveals: "
        "1. The US Copyright Office has affirmed that copyright protection requires 'human authorship', meaning fully AI-generated works without substantial human control are not registerable. "
        "2. Over 75% of digital illustrators surveyed report concerns about intellectual property theft, while 68% have experimented with integrating AI generators into their workflow for ideation. "
        "3. Historically, technological disruptions in art (such as photography in the 19th century) initially faced legal and aesthetic pushback before becoming established creative mediums."
    ),
    "cryptocurrency": (
        "Financial and technology data states: "
        "1. Bitcoin and Ethereum transactions require consensus mechanisms that historically consume substantial power, though Ethereum's 2022 Proof-of-Stake transition reduced its energy footprint by 99.9%. "
        "2. The World Bank estimates that crypto-assets could reduce remittance transaction costs to under 3% (compared to the traditional banking average of 6.2%). "
        "3. High price volatility (with Bitcoin experiencing average annual price swings of over 50%) limits crypto's current utility as a stable medium of exchange."
    ),
    "crypto": (
        "Financial and technology data states: "
        "1. Bitcoin and Ethereum transactions require consensus mechanisms that historically consume substantial power, though Ethereum's 2022 Proof-of-Stake transition reduced its energy footprint by 99.9%. "
        "2. The World Bank estimates that crypto-assets could reduce remittance transaction costs to under 3% (compared to the traditional banking average of 6.2%). "
        "3. High price volatility (with Bitcoin experiencing average annual price swings of over 50%) limits crypto's current utility as a stable medium of exchange."
    ),
    "bitcoin": (
        "Financial and technology data states: "
        "1. Bitcoin and Ethereum transactions require consensus mechanisms that historically consume substantial power, though Ethereum's 2022 Proof-of-Stake transition reduced its energy footprint by 99.9%. "
        "2. The World Bank estimates that crypto-assets could reduce remittance transaction costs to under 3% (compared to the traditional banking average of 6.2%). "
        "3. High price volatility (with Bitcoin experiencing average annual price swings of over 50%) limits crypto's current utility as a stable medium of exchange."
    ),
}

FALLBACK_CONTEXT = (
    "Consider the following objective parameters for balanced analysis: "
    "1. Disruptive technologies introduce cost efficiencies and scalability, but can lead to structural displacement and loss of human oversight. "
    "2. Personal emotional connection, community trust, and organic interaction are critical factors in long-term human satisfaction. "
    "3. Successful implementation of innovation usually involves a hybrid, phased, or regulated approach rather than binary eradication."
)

def get_grounding_context(topic: str) -> str:
    """
    Analyzes the topic text for keywords to return a relevant grounding context.
    If no keywords match, returns a balanced fallback context snippet.
    """
    normalized_topic = topic.lower()
    matched_contexts = []
    
    # Check for multi-word or single-word matches using substring check
    for key, context in GROUNDING_DATABASE.items():
        if key in normalized_topic:
            matched_contexts.append(context)
            
    if matched_contexts:
        # Return the first matched context for simplicity and focus
        return matched_contexts[0]
        
    return FALLBACK_CONTEXT
