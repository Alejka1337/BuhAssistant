import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/Theme';
import { useSEO } from '../hooks/useSEO';
import { PAGE_METAS } from '../utils/seo';

// Тип для секций политики
interface PolicySection {
  id: string;
  title: string;
  subsections?: PolicySection[];
}

// Структура документа
const policySections: PolicySection[] = [
  { id: 'intro', title: 'Privacy Policy' },
  { id: 'summary', title: 'Summary of Key Points' },
  { id: 'toc', title: 'Table of Contents' },
  { id: 'infocollect', title: '1. What Information Do We Collect?',
    subsections: [
      { id: 'personalinfo', title: 'Personal Information You Disclose to Us' },
      { id: 'autoinfo', title: 'Information Automatically Collected' },
      { id: 'googleapi', title: 'Google API' },
    ]
  },
  { id: 'infouse', title: '2. How Do We Process Your Information?' },
  { id: 'whoshare', title: '3. When and With Whom Do We Share Your Personal Information?' },
  { id: 'ai', title: '4. Do We Offer Artificial Intelligence-Based Products?' },
  { id: 'inforetain', title: '5. How Long Do We Keep Your Information?' },
  { id: 'infosafe', title: '6. How Do We Keep Your Information Safe?' },
  { id: 'infominors', title: '7. Do We Collect Information From Minors?' },
  { id: 'privacyrights', title: '8. What Are Your Privacy Rights?',
    subsections: [
      { id: 'withdrawconsent', title: 'Withdrawing Your Consent' },
      { id: 'accountinfo', title: 'Account Information' },
    ]
  },
  { id: 'DNT', title: '9. Controls for Do-Not-Track Features' },
  { id: 'policyupdates', title: '10. Do We Make Updates to This Notice?' },
  { id: 'contact', title: '11. How Can You Contact Us About This Notice?' },
  { id: 'request', title: '12. How Can You Review, Update, or Delete the Data We Collect?' },
];

export default function PrivacyPolicy() {
  useSEO(PAGE_METAS.privacyPolicy);
  
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const checkMobile = () => {
      const width = Dimensions.get('window').width;
      setIsMobile(width < 768);
    };

    checkMobile();
    const subscription = Dimensions.addEventListener('change', checkMobile);

    return () => subscription?.remove();
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (Platform.OS === 'web') {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  const renderSidebarItem = (section: PolicySection, level: number = 0) => {
    const isActive = activeSection === section.id;
    const hasSubsections = section.subsections && section.subsections.length > 0;

    return (
      <View key={section.id}>
        <TouchableOpacity
          style={[
            styles.sidebarItem,
            { paddingLeft: Spacing.md + (level * Spacing.md) },
            isActive && styles.sidebarItemActive,
          ]}
          onPress={() => scrollToSection(section.id)}
        >
          <Text
            style={[
              styles.sidebarItemText,
              { fontSize: level === 0 ? Fonts.sizes.base : Fonts.sizes.sm },
              isActive && styles.sidebarItemTextActive,
            ]}
            numberOfLines={2}
          >
            {section.title}
          </Text>
        </TouchableOpacity>
        {hasSubsections && section.subsections!.map(sub => renderSidebarItem(sub, level + 1))}
      </View>
    );
  };

  const renderSidebar = () => {
    // Не показываем sidebar на мобильных
    if (isMobile) {
      return null;
    }

    return (
      <View style={styles.sidebar}>
      <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        {policySections.map(section => renderSidebarItem(section))}
      </ScrollView>
    </View>
  );
  };

  const renderContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View id="intro" style={styles.section}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.subtitle}>Last updated: November 28, 2025</Text>
      </View>

      {/* Summary */}
      <View id="summary" style={styles.section}>
        <Text style={styles.heading1}>Summary of Key Points</Text>
        <Text style={[styles.paragraph, styles.italic]}>
          This summary provides key points from our Privacy Notice, but you can find out more details about 
          any of these topics by clicking the link following each key point or by using our table of contents 
          below to find the section you are looking for.
        </Text>
        
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>What personal information do we process?</Text> When you visit, use, or navigate 
          our Services, we may process personal information depending on how you interact with us and the Services, 
          the choices you make, and the products and features you use.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Do we process any sensitive personal information?</Text> Some of the information 
          may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, 
          sexual orientation, and religious beliefs. We do not process sensitive personal information.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Do we collect any information from third parties?</Text> We do not collect any 
          information from third parties.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>How do we process your information?</Text> We process your information to provide, 
          improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply 
          with law. We may also process your information for other purposes with your consent.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In what situations and with which parties do we share personal information?</Text> We 
          may share information in specific situations and with specific third parties.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>How do we keep your information safe?</Text> We have adequate organizational and 
          technical processes and procedures in place to protect your personal information. However, no electronic 
          transmission over the internet can be guaranteed to be 100% secure.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>What are your rights?</Text> Depending on where you are located geographically, 
          the applicable privacy law may mean you have certain rights regarding your personal information.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>How do you exercise your rights?</Text> The easiest way to exercise your rights 
          is by submitting a{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('https://app.termly.io/dsar/12e249d6-147c-4d8d-a7dd-638fe651cb47')}>
            data subject access request
          </Text>, or by contacting us.
        </Text>
      </View>

      {/* Table of Contents */}
      <View id="toc" style={styles.section}>
        <Text style={styles.heading1}>Table of Contents</Text>
        {policySections.slice(3).map((section) => (
          <TouchableOpacity
            key={section.id}
            onPress={() => scrollToSection(section.id)}
            style={styles.tocItem}
          >
            <Text style={styles.tocLink}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section 1: What Information Do We Collect */}
      <View id="infocollect" style={styles.section}>
        <Text style={styles.heading1}>1. What Information Do We Collect?</Text>

        <View id="personalinfo" style={styles.subsection}>
          <Text style={styles.heading2}>Personal Information You Disclose to Us</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>In Short:</Text>
            <Text style={styles.italic}> We collect personal information that you provide to us.</Text>
          </Text>
          
          <Text style={styles.paragraph}>
            We collect personal information that you voluntarily provide to us when you register on the Services, 
            express an interest in obtaining information about us or our products and Services, when you participate 
            in activities on the Services, or otherwise when you contact us.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Personal Information Provided by You.</Text> The personal information that we 
            collect depends on the context of your interactions with us and the Services, the choices you make, and 
            the products and features you use. The personal information we collect may include the following:
          </Text>

          <View style={styles.list}>
            <Text style={styles.listItem}>• email addresses</Text>
            <Text style={styles.listItem}>• names</Text>
          </View>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Sensitive Information.</Text> We do not process sensitive information.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Application Data.</Text> If you use our application(s), we also may collect 
            the following information if you choose to provide us with access or permission:
          </Text>

          <View style={styles.list}>
            <Text style={styles.listItem}>
              • <Text style={styles.italic}>Mobile Device Access.</Text> We may request access or permission to 
              certain features from your mobile device, including your mobile device's microphone, and other features. 
              If you wish to change our access or permissions, you may do so in your device's settings.
            </Text>
            <Text style={styles.listItem}>
              • <Text style={styles.italic}>Push Notifications.</Text> We may request to send you push notifications 
              regarding your account or certain features of the application(s). If you wish to opt out from receiving 
              these types of communications, you may turn them off in your device's settings.
            </Text>
          </View>

          <Text style={styles.paragraph}>
            This information is primarily needed to maintain the security and operation of our application(s), for 
            troubleshooting, and for our internal analytics and reporting purposes.
          </Text>

          <Text style={styles.paragraph}>
            All personal information that you provide to us must be true, complete, and accurate, and you must notify 
            us of any changes to such personal information.
          </Text>
        </View>

        <View id="autoinfo" style={styles.subsection}>
          <Text style={styles.heading2}>Information Automatically Collected</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>In Short:</Text>
            <Text style={styles.italic}> Some information — such as your Internet Protocol (IP) address and/or browser 
            and device characteristics — is collected automatically when you visit our Services.</Text>
          </Text>

          <Text style={styles.paragraph}>
            We automatically collect certain information when you visit, use, or navigate the Services. This information 
            does not reveal your specific identity (like your name or contact information) but may include device and 
            usage information, such as your IP address, browser and device characteristics, operating system, language 
            preferences, referring URLs, device name, country, location, information about how and when you use our 
            Services, and other technical information.
          </Text>

          <Text style={styles.paragraph}>
            The information we collect includes:
          </Text>

          <View style={styles.list}>
            <Text style={styles.listItem}>
              • <Text style={styles.italic}>Device Data.</Text> We collect device data such as information about your 
              computer, phone, tablet, or other device you use to access the Services. Depending on the device used, 
              this device data may include information such as your IP address (or proxy server), device and application 
              identification numbers, location, browser type, hardware model, Internet service provider and/or mobile 
              carrier, operating system, and system configuration information.
            </Text>
          </View>
        </View>

        <View id="googleapi" style={styles.subsection}>
          <Text style={styles.heading2}>Google API</Text>
          <Text style={styles.paragraph}>
            Our use of information received from Google APIs will adhere to{' '}
            <Text style={styles.link} onPress={() => handleLinkPress('https://developers.google.com/terms/api-services-user-data-policy')}>
              Google API Services User Data Policy
            </Text>, including the{' '}
            <Text style={styles.link} onPress={() => handleLinkPress('https://developers.google.com/terms/api-services-user-data-policy#limited-use')}>
              Limited Use requirements
            </Text>.
          </Text>
        </View>
      </View>

      {/* Section 2: How Do We Process Your Information */}
      <View id="infouse" style={styles.section}>
        <Text style={styles.heading1}>2. How Do We Process Your Information?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We process your information to provide, improve, and administer our Services, 
          communicate with you, for security and fraud prevention, and to comply with law. We may also process your 
          information for other purposes with your consent.</Text>
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>We process your personal information for a variety of reasons, depending on how 
          you interact with our Services, including:</Text>
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>To facilitate account creation and authentication and otherwise manage user 
            accounts.</Text> We may process your information so you can create and log in to your account, as well as 
            keep your account in working order.
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>To respond to user inquiries/offer support to users.</Text> We may process your 
            information to respond to your inquiries and solve any potential issues you might have with the requested 
            service.
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>To identify usage trends.</Text> We may process information about how you use 
            our Services to better understand how they are being used so we can improve them.
          </Text>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>To comply with our legal obligations.</Text> We may process your information to 
            comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal 
            rights.
          </Text>
        </View>
      </View>

      {/* Section 3: When and With Whom */}
      <View id="whoshare" style={styles.section}>
        <Text style={styles.heading1}>3. When and With Whom Do We Share Your Personal Information?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We may share information in specific situations described in this section and/or 
          with the following third parties.</Text>
        </Text>

        <Text style={styles.paragraph}>
          We may need to share your personal information in the following situations:
        </Text>

        <View style={styles.list}>
          <Text style={styles.listItem}>
            • <Text style={styles.bold}>Business Transfers.</Text> We may share or transfer your information in connection 
            with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a 
            portion of our business to another company.
          </Text>
        </View>
      </View>

      {/* Section 4: AI Products */}
      <View id="ai" style={styles.section}>
        <Text style={styles.heading1}>4. Do We Offer Artificial Intelligence-Based Products?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We offer products, features, or tools powered by artificial intelligence, machine 
          learning, or similar technologies.</Text>
        </Text>

        <Text style={styles.paragraph}>
          As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine 
          learning, or similar technologies (collectively, "AI Products"). These tools are designed to enhance your 
          experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the 
          AI Products within our Services.
        </Text>

        <Text style={styles.heading3}>Use of AI Technologies</Text>
        <Text style={styles.paragraph}>
          We provide the AI Products through third-party service providers ("AI Service Providers"), including OpenAI. 
          As outlined in this Privacy Notice, your input, output, and personal information will be shared with and 
          processed by these AI Service Providers to enable your use of our AI Products. You must not use the AI Products 
          in any way that violates the terms or policies of any AI Service Provider.
        </Text>

        <Text style={styles.heading3}>Our AI Products</Text>
        <Text style={styles.paragraph}>
          Our AI Products are designed for the following functions:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• AI predictive analytics</Text>
        </View>

        <Text style={styles.heading3}>How We Process Your Data Using AI</Text>
        <Text style={styles.paragraph}>
          All personal information processed using our AI Products is handled in line with our Privacy Notice and our 
          agreement with third parties. This ensures high security and safeguards your personal information throughout 
          the process, giving you peace of mind about your data's safety.
        </Text>
      </View>

      {/* Section 5: How Long */}
      <View id="inforetain" style={styles.section}>
        <Text style={styles.heading1}>5. How Long Do We Keep Your Information?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We keep your information for as long as necessary to fulfill the purposes outlined 
          in this Privacy Notice unless otherwise required by law.</Text>
        </Text>

        <Text style={styles.paragraph}>
          We will only keep your personal information for as long as it is necessary for the purposes set out in this 
          Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or 
          other legal requirements). No purpose in this notice will require us keeping your personal information for 
          longer than the period of time in which users have an account with us.
        </Text>

        <Text style={styles.paragraph}>
          When we have no ongoing legitimate business need to process your personal information, we will either delete 
          or anonymize such information, or, if this is not possible (for example, because your personal information has 
          been stored in backup archives), then we will securely store your personal information and isolate it from any 
          further processing until deletion is possible.
        </Text>
      </View>

      {/* Section 6: How We Keep Safe */}
      <View id="infosafe" style={styles.section}>
        <Text style={styles.heading1}>6. How Do We Keep Your Information Safe?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We aim to protect your personal information through a system of organizational 
          and technical security measures.</Text>
        </Text>

        <Text style={styles.paragraph}>
          We have implemented appropriate and reasonable technical and organizational security measures designed to 
          protect the security of any personal information we process. However, despite our safeguards and efforts to 
          secure your information, no electronic transmission over the Internet or information storage technology can be 
          guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other 
          unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or 
          modify your information. Although we will do our best to protect your personal information, transmission of 
          personal information to and from our Services is at your own risk. You should only access the Services within 
          a secure environment.
        </Text>
      </View>

      {/* Section 7: Minors */}
      <View id="infominors" style={styles.section}>
        <Text style={styles.heading1}>7. Do We Collect Information From Minors?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> We do not knowingly collect data from or market to children under 18 years of age.</Text>
        </Text>

        <Text style={styles.paragraph}>
          We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly 
          sell such personal information. By using the Services, you represent that you are at least 18 or that you are the 
          parent or guardian of such a minor and consent to such minor dependent's use of the Services. If we learn that 
          personal information from users less than 18 years of age has been collected, we will deactivate the account and 
          take reasonable measures to promptly delete such data from our records. If you become aware of any data we may 
          have collected from children under age 18, please contact us at{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
            manager@eglavbuh.com.ua
          </Text>.
        </Text>
      </View>

      {/* Section 8: Privacy Rights */}
      <View id="privacyrights" style={styles.section}>
        <Text style={styles.heading1}>8. What Are Your Privacy Rights?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> You may review, change, or terminate your account at any time, depending on your 
          country, province, or state of residence.</Text>
        </Text>

        <View id="withdrawconsent" style={styles.subsection}>
          <Text style={styles.heading3}>Withdrawing Your Consent</Text>
          <Text style={styles.paragraph}>
            If we are relying on your consent to process your personal information, which may be express and/or implied 
            consent depending on the applicable law, you have the right to withdraw your consent at any time. You can 
            withdraw your consent at any time by contacting us by using the contact details provided in the section 
            "How Can You Contact Us About This Notice?" below.
          </Text>

          <Text style={styles.paragraph}>
            However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, 
            when applicable law allows, will it affect the processing of your personal information conducted in reliance 
            on lawful processing grounds other than consent.
          </Text>
        </View>

        <View id="accountinfo" style={styles.subsection}>
          <Text style={styles.heading3}>Account Information</Text>
          <Text style={styles.paragraph}>
            If you would at any time like to review or change the information in your account or terminate your account, 
            you can:
          </Text>

          <View style={styles.list}>
            <Text style={styles.listItem}>• Contact us using the contact information provided.</Text>
          </View>

          <Text style={styles.paragraph}>
            Upon your request to terminate your account, we will deactivate or delete your account and information from 
            our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot 
            problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal 
            requirements.
          </Text>

          <Text style={styles.paragraph}>
            If you have questions or comments about your privacy rights, you may email us at{' '}
            <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
              manager@eglavbuh.com.ua
            </Text>.
          </Text>
        </View>
      </View>

      {/* Section 9: DNT */}
      <View id="DNT" style={styles.section}>
        <Text style={styles.heading1}>9. Controls for Do-Not-Track Features</Text>
        <Text style={styles.paragraph}>
          Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") 
          feature or setting you can activate to signal your privacy preference not to have data about your online 
          browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and 
          implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any 
          other mechanism that automatically communicates your choice not to be tracked online. If a standard for online 
          tracking is adopted that we must follow in the future, we will inform you about that practice in a revised 
          version of this Privacy Notice.
        </Text>
      </View>

      {/* Section 10: Updates */}
      <View id="policyupdates" style={styles.section}>
        <Text style={styles.heading1}>10. Do We Make Updates to This Notice?</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>In Short:</Text>
          <Text style={styles.italic}> Yes, we will update this notice as necessary to stay compliant with relevant laws.</Text>
        </Text>

              <Text style={styles.paragraph}>
          We may update this Privacy Notice from time to time. The updated version will be indicated by an updated 
          "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may 
          notify you either by prominently posting a notice of such changes or by directly sending you a notification. We 
          encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
              </Text>
            </View>

      {/* Section 11: Contact */}
      <View id="contact" style={styles.section}>
        <Text style={styles.heading1}>11. How Can You Contact Us About This Notice?</Text>
        <Text style={styles.paragraph}>
          If you have questions or comments about this notice, you may email us at{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('mailto:manager@eglavbuh.com.ua')}>
            manager@eglavbuh.com.ua
          </Text>{' '}
          or contact us by post at:
        </Text>

        <View style={styles.addressBlock}>
          <Text style={styles.paragraph}>eGlavBuh</Text>
          <Text style={styles.paragraph}>Hersonskyi provulok 1</Text>
          <Text style={styles.paragraph}>Kyev, Ukraine 02000</Text>
          <Text style={styles.paragraph}>Ukraine</Text>
        </View>
      </View>

      {/* Section 12: Review/Update/Delete */}
      <View id="request" style={styles.section}>
        <Text style={styles.heading1}>12. How Can You Review, Update, or Delete the Data We Collect?</Text>
        <Text style={styles.paragraph}>
          Based on the applicable laws of your country, you may have the right to request access to the personal 
          information we collect from you, details about how we have processed it, correct inaccuracies, or delete your 
          personal information. You may also have the right to withdraw your consent to our processing of your personal 
          information. These rights may be limited in some circumstances by applicable law. To request to review, update, 
          or delete your personal information, please fill out and submit a{' '}
          <Text style={styles.link} onPress={() => handleLinkPress('https://app.termly.io/dsar/12e249d6-147c-4d8d-a7dd-638fe651cb47')}>
            data subject access request
          </Text>.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 eGlavBuh. All rights reserved.</Text>
        <Text style={[styles.footerText, { marginTop: Spacing.sm }]}>
          Contact: manager@eglavbuh.com.ua
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Layout */}
      <View style={styles.layout}>
        {renderSidebar()}
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Layout
  layout: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: Colors.cardBackground,
    borderRightWidth: 1,
    borderRightColor: Colors.borderColor,
  },
  sidebarScroll: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  sidebarItem: {
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
  },
  sidebarItemActive: {
    backgroundColor: 'rgba(34, 136, 34, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sidebarItemText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.body,
  },
  sidebarItemTextActive: {
    color: Colors.primary,
    fontWeight: Fonts.weights.semibold as any,
  },

  // Content
  content: {
    flex: 1,
  },

  // Sections
  section: {
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  subsection: {
    marginTop: Spacing.lg,
  },

  // Typography
  title: {
    fontSize: Fonts.sizes.xxxl + 8,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Fonts.sizes.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    fontFamily: Fonts.body,
  },
  heading1: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  heading2: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  heading3: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.semibold as any,
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  paragraph: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.base * 1.6,
    marginBottom: Spacing.md,
    fontFamily: Fonts.body,
  },
  bold: {
    fontWeight: Fonts.weights.bold as any,
    color: Colors.textPrimary,
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Lists
  list: {
    marginLeft: Spacing.md,
    marginBottom: Spacing.md,
  },
  listItem: {
    fontSize: Fonts.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Fonts.sizes.base * 1.6,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.body,
  },

  // Table of Contents
  tocItem: {
    paddingVertical: Spacing.sm,
  },
  tocLink: {
    fontSize: Fonts.sizes.base,
    color: Colors.primary,
    textDecorationLine: 'underline',
    fontFamily: Fonts.body,
  },

  // Address Block
  addressBlock: {
    marginLeft: Spacing.md,
    marginTop: Spacing.md,
  },

  // Footer
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderColor,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    fontFamily: Fonts.body,
  },
});
