import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface CertificateStackProps extends StackProps {
  domainName: string;
  certificateDomainName: string;
}

// Certificate Stack in us-east-1
export class CertificateStack extends Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const { domainName, certificateDomainName } = props;

    // Import existing hosted zone
    const hostedZone = HostedZone.fromLookup(this, "HostedZone", {
      domainName,
    });

    // Create certificate in us-east-1
    const certificate = new Certificate(this, "ApiCertificate", {
      domainName: certificateDomainName,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    // Store ARN for cross-stack reference
    this.certificateArn = certificate.certificateArn;

    // Export for cross-stack reference
    new CfnOutput(this, "CertificateArn", {
      value: certificate.certificateArn,
      exportName: `${this.stackName}-CertificateArn`,
      description: "Certificate ARN for API Gateway custom domain",
    });

    // Export domain name for consistency
    new CfnOutput(this, "DomainName", {
      value: domainName,
      exportName: `${this.stackName}-DomainName`,
    });
  }
}
