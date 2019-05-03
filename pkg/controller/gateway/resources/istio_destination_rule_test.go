/*
 * Copyright (c) 2019 WSO2 Inc. (http:www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http:www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package resources

import (
	"testing"

	"github.com/google/go-cmp/cmp"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/cellery-io/mesh-controller/pkg/apis/istio/networking/v1alpha3"
	"github.com/cellery-io/mesh-controller/pkg/apis/mesh/v1alpha1"
	"github.com/cellery-io/mesh-controller/pkg/controller"
)

func TestCreateIstioDestinationRule(t *testing.T) {
	gateway := &v1alpha1.Gateway{
		Spec: v1alpha1.GatewaySpec{
			Type: v1alpha1.GatewayTypeMicroGateway,
			Host: "test.com",
			HTTPRoutes: []v1alpha1.HTTPRoute{
				{
					Authenticate: true,
					Global:       true,
					Backend:      "mytestservice",
					Context:      "hello",
					Definitions: []v1alpha1.APIDefinition{
						{
							Path:   "sayHello",
							Method: "GET",
						},
					},
				},
			},
		},
	}

	destinationRule := CreateIstioDestinationRule(gateway)
	expected := &v1alpha3.DestinationRule{
		ObjectMeta: metav1.ObjectMeta{
			Name:      IstioDestinationRuleName(gateway),
			Namespace: gateway.Namespace,
			Labels:    createGatewayLabels(gateway),
			OwnerReferences: []metav1.OwnerReference{
				*controller.CreateServiceOwnerRef(gateway),
			},
		},

		Spec: v1alpha3.DestinationRuleSpec{
			Host: GatewayK8sServiceName(gateway),
			TrafficPolicy: &v1alpha3.TrafficPolicy{
				LoadBalancer: &v1alpha3.LoadBalancerSettings{
					Simple: "ROUND_ROBIN",
				},
				PortLevelSettings: []*v1alpha3.TrafficPolicy_PortTrafficPolicy{
					{
						Port: &v1alpha3.PortSelector{
							Number: 443,
						},
						Tls: &v1alpha3.TLSSettings{
							Mode: "ISTIO_MUTUAL",
						},
					},
				},
			},
		},
	}

	if diff := cmp.Diff(expected, destinationRule); diff != "" {
		t.Errorf("CreateIstioDestinationRule (-expected, +actual)\n%v", diff)
	}
}
