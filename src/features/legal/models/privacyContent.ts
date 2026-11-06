import type { LegalDocument } from "./legal";

/**
 * The Privacy policy shown at /privacy. Text in [square brackets] is still to
 * be filled in with the company's details.
 */
export const privacyContent: LegalDocument = {
  title: "Privacy policy",
  updated: "Last updated 1 Oct 2026",
  intro:
    "This document is an electronic record in terms of the Information Technology Act, 2000 and the rules made under it, as applicable, and does not require any physical or digital signature. It is published in accordance with Rule 3(1) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and is intended to comply with the Digital Personal Data Protection Act, 2023.",
  sections: [
    {
      heading: "Scope and Applicability",
      body: [
        "This Privacy Policy (the “Policy”) describes how [TrainDhaba legal entity name] (“TrainDhaba”, “we”, “us” or “our”) collects, uses, stores, shares and protects personal data of restaurant owners, authorised representatives, staff and riders (“Partner”, “you” or “your”) who register on or use the TrainDhaba Partner website and the TrainDhaba Partner mobile application (together, the “Platform”).",
        "By registering on or using the Platform, you consent to the collection and processing of your personal data in accordance with this Policy. This Policy should be read together with the Partner Terms and Conditions. If you do not agree with this Policy, please do not register on or use the Platform.",
      ],
    },
    {
      heading: "Information We Collect",
      body: [
        "We collect the following categories of information, some of which may constitute personal data or sensitive personal data under applicable law:",
        {
          list: [
            { lead: "Identity and contact information:", text: "name of the owner and authorised representative, mobile number, email address, photograph and identity proof." },
            { lead: "Business information:", text: "restaurant name, restaurant type, cuisines, logo, cover photo, address, map location, served stations, operating hours and Menu." },
            { lead: "Statutory documents:", text: "FSSAI Licence, GSTIN, PAN, shops and establishments registration and business proof." },
            { lead: "Financial information:", text: "bank account holder name, account number, IFSC, cancelled cheque, Payout and invoice records." },
            { lead: "Rider information:", text: "name, mobile number and identity details of riders added by you." },
            { lead: "Transaction information:", text: "Orders received, accepted, prepared, delivered or cancelled, ratings, reviews and complaints." },
            { lead: "Device and usage information:", text: "device model, operating system, app version, IP address, browser type, log-in times, location (when you permit it) and interactions with the Platform." },
          ],
        },
      ],
    },
    {
      heading: "How We Collect Information",
      body: [
        "We collect information that you provide directly when you register, complete your profile, upload documents, add riders, update your Menu or contact support. We collect information automatically when you use the Platform, through logs, cookies and similar technologies. We may also receive information from third parties such as document verification agencies, banks and payment partners, government databases used for verification of GSTIN, PAN or FSSAI Licence, and Delivery Partners.",
      ],
    },
    {
      heading: "Purposes of Processing",
      body: [
        "We process your information for the following purposes:",
        {
          list: [
            "to verify your identity, documents and eligibility and to create and manage your Partner account;",
            "to list your restaurant and Menu and display them to Passengers travelling on trains that stop at your station;",
            "to send you Orders, notifications, alerts and service messages by app notification, SMS, WhatsApp, call or email;",
            "to coordinate pickup and delivery of Orders with Delivery Partners;",
            "to calculate Commission, process Payouts, issue invoices and meet tax, accounting and audit requirements;",
            "to handle Passenger complaints, ratings and disputes and to maintain food safety and service quality;",
            "to detect, prevent and investigate fraud, misuse, security incidents and violations of our terms;",
            "to analyse usage and improve the Platform, and, with your consent, to send you information about new features, programmes and offers;",
            "to comply with applicable law, court orders and requests from government authorities.",
          ],
        },
      ],
    },
    {
      heading: "Consent and Legal Basis",
      body: [
        "We process your personal data on the basis of your consent, which you give when you register on the Platform, and for legitimate uses permitted under the Digital Personal Data Protection Act, 2023, including the performance of our contract with you and compliance with legal obligations. You may withdraw your consent at any time by writing to us. Withdrawal of consent will not affect processing carried out before withdrawal, but may mean that we can no longer list your restaurant or process Payouts.",
      ],
    },
    {
      heading: "Disclosure and Sharing",
      body: [
        "We do not sell your personal data. We share information only as described below:",
        {
          list: [
            { lead: "Passengers", text: "can see your restaurant name, logo, photos, Menu, prices, ratings, station and operating status." },
            { lead: "Delivery Partners", text: "receive your restaurant name, address, pickup location and contact number to collect Orders." },
            { lead: "Service providers", text: "such as cloud hosting, SMS and messaging, document verification, analytics and customer support providers, who process data on our behalf under contractual confidentiality and security obligations." },
            { lead: "Banks and payment partners", text: "receive your bank details to process Payouts and collections." },
            { lead: "Government and regulatory authorities", text: ", including tax authorities, FSSAI and law enforcement agencies, where required by law or to protect the rights, property or safety of TrainDhaba, Passengers or others." },
            { lead: "Successors", text: "in the event of a merger, acquisition, restructuring or sale of assets, subject to this Policy." },
          ],
        },
      ],
    },
    {
      heading: "Passenger Information Made Available to You",
      body: [
        "For each Order, we share limited Passenger information with you, such as the Passenger’s first name, train number, coach, seat number and delivery station. You act as an independent recipient of this information and must use it only to prepare and hand over the relevant Order. You must not store, copy, sell, share or use Passenger information for marketing or any other purpose, and you must delete any printed copies (such as KOTs) once the Order is completed.",
      ],
    },
    {
      heading: "Cookies and Similar Technologies",
      body: [
        "We use cookies, local storage and similar technologies on the Platform to keep you signed in, remember your preferences, secure your account and understand how the Platform is used. You can control cookies through your browser settings; however, disabling some cookies may affect the functioning of the Platform.",
      ],
    },
    {
      heading: "Data Retention",
      body: [
        "We retain your personal data for as long as your Partner account is active and thereafter for as long as necessary to fulfil the purposes described in this Policy, to resolve disputes, and to comply with legal obligations. Invoices, tax and accounting records are retained for at least eight (8) years as required under applicable tax laws. Once retention is no longer required, we delete or anonymise your data within ninety (90) days.",
      ],
    },
    {
      heading: "Data Security",
      body: [
        "We implement reasonable security practices and procedures, including encryption of data in transit and at rest, access controls, role-based permissions, audit logs and regular security reviews. Statutory documents and bank details are accessible only to authorised personnel in our verification and payouts teams. Sign-in to the Platform is protected by one-time passwords sent to your registered mobile number. While we take appropriate measures to protect your data, no method of transmission or storage is completely secure, and you are responsible for keeping your device and one-time passwords secure.",
      ],
    },
    {
      heading: "Your Rights",
      body: [
        "Subject to applicable law, you have the right to:",
        {
          list: [
            "access a summary of the personal data we hold about you and the processing activities undertaken;",
            "correct, complete or update inaccurate or incomplete personal data, which you can also do directly from Profile on the Platform;",
            "request erasure of personal data that is no longer necessary, subject to our legal retention obligations;",
            "withdraw consent and opt out of marketing communications from Settings on the Platform;",
            "nominate another person to exercise your rights in the event of death or incapacity; and",
            "raise a grievance with our Grievance Officer and, if unresolved, with the Data Protection Board of India.",
          ],
        },
        "Order and Payout notifications are essential service messages and cannot be switched off while your restaurant is online.",
      ],
    },
    {
      heading: "Children’s Data",
      body: [
        "The Platform is intended only for businesses and individuals who are at least eighteen (18) years of age. We do not knowingly collect personal data of children. If you believe that a child has provided us with personal data, please contact us and we will delete it.",
      ],
    },
    {
      heading: "Storage and Transfer",
      body: [
        "Your data is stored on secure servers located in India. Where any data is processed outside India by our service providers, such transfer will be made only in accordance with applicable law and with appropriate safeguards in place.",
      ],
    },
    {
      heading: "Changes to this Policy",
      body: [
        "We may update this Policy from time to time to reflect changes in our practices or in applicable law. We will notify you of material changes on the Platform, by SMS or by email before they take effect. The date at the top of this Policy shows when it was last updated. Your continued use of the Platform after the effective date constitutes acceptance of the updated Policy.",
      ],
    },
    {
      heading: "Grievance Officer and Contact",
      body: [
        "If you have any questions, concerns or complaints about this Policy or the processing of your personal data, please contact our Grievance Officer: Grievance Officer, [TrainDhaba legal entity name], [registered office address], email: privacy@traindhaba.com. We will acknowledge your grievance within forty-eight (48) hours and resolve it within thirty (30) days or such other time as prescribed by law.",
      ],
    },
  ],
};
