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
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/cellery-io/mesh-controller/pkg/apis/mesh/v1alpha2"
	"github.com/cellery-io/mesh-controller/pkg/config"
	"github.com/cellery-io/mesh-controller/pkg/controller"
)

func MakeSecret(component *v1alpha2.Component, secret *corev1.Secret, cfg config.Interface) *corev1.Secret {
	// todo: use cfg to decrypt content if required
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      SecretName(component, secret),
			Namespace: component.Namespace,
			Labels:    makeLabels(component),
			OwnerReferences: []metav1.OwnerReference{
				*controller.CreateComponentOwnerRef(component),
			},
		},
		Data: secret.Data,
	}
}

func RequireSecretUpdate(component *v1alpha2.Component, secret *corev1.Secret) bool {
	return component.Generation != component.Status.ObservedGeneration ||
		secret.Generation != component.Status.SecretGenerations[secret.Name]
}

func CopySecret(source, destination *corev1.Secret) {
	destination.Data = source.Data
	destination.Labels = source.Labels
	destination.Annotations = source.Annotations
}

func StatusFromSecret(component *v1alpha2.Component, secret *corev1.Secret) {
	component.Status.SecretGenerations[secret.Name] = secret.Generation
}
