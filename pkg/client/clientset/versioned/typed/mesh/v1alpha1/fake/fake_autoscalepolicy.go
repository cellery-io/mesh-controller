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

// Code generated by client-gen. DO NOT EDIT.

package fake

import (
	v1alpha1 "github.com/cellery-io/mesh-controller/pkg/apis/mesh/v1alpha1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
	schema "k8s.io/apimachinery/pkg/runtime/schema"
	types "k8s.io/apimachinery/pkg/types"
	watch "k8s.io/apimachinery/pkg/watch"
	testing "k8s.io/client-go/testing"
)

// FakeAutoscalePolicies implements AutoscalePolicyInterface
type FakeAutoscalePolicies struct {
	Fake *FakeMeshV1alpha1
	ns   string
}

var autoscalepoliciesResource = schema.GroupVersionResource{Group: "mesh", Version: "v1alpha1", Resource: "autoscalepolicies"}

var autoscalepoliciesKind = schema.GroupVersionKind{Group: "mesh", Version: "v1alpha1", Kind: "AutoscalePolicy"}

// Get takes name of the autoscalePolicy, and returns the corresponding autoscalePolicy object, and an error if there is any.
func (c *FakeAutoscalePolicies) Get(name string, options v1.GetOptions) (result *v1alpha1.AutoscalePolicy, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewGetAction(autoscalepoliciesResource, c.ns, name), &v1alpha1.AutoscalePolicy{})

	if obj == nil {
		return nil, err
	}
	return obj.(*v1alpha1.AutoscalePolicy), err
}

// List takes label and field selectors, and returns the list of AutoscalePolicies that match those selectors.
func (c *FakeAutoscalePolicies) List(opts v1.ListOptions) (result *v1alpha1.AutoscalePolicyList, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewListAction(autoscalepoliciesResource, autoscalepoliciesKind, c.ns, opts), &v1alpha1.AutoscalePolicyList{})

	if obj == nil {
		return nil, err
	}

	label, _, _ := testing.ExtractFromListOptions(opts)
	if label == nil {
		label = labels.Everything()
	}
	list := &v1alpha1.AutoscalePolicyList{ListMeta: obj.(*v1alpha1.AutoscalePolicyList).ListMeta}
	for _, item := range obj.(*v1alpha1.AutoscalePolicyList).Items {
		if label.Matches(labels.Set(item.Labels)) {
			list.Items = append(list.Items, item)
		}
	}
	return list, err
}

// Watch returns a watch.Interface that watches the requested autoscalePolicies.
func (c *FakeAutoscalePolicies) Watch(opts v1.ListOptions) (watch.Interface, error) {
	return c.Fake.
		InvokesWatch(testing.NewWatchAction(autoscalepoliciesResource, c.ns, opts))

}

// Create takes the representation of a autoscalePolicy and creates it.  Returns the server's representation of the autoscalePolicy, and an error, if there is any.
func (c *FakeAutoscalePolicies) Create(autoscalePolicy *v1alpha1.AutoscalePolicy) (result *v1alpha1.AutoscalePolicy, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewCreateAction(autoscalepoliciesResource, c.ns, autoscalePolicy), &v1alpha1.AutoscalePolicy{})

	if obj == nil {
		return nil, err
	}
	return obj.(*v1alpha1.AutoscalePolicy), err
}

// Update takes the representation of a autoscalePolicy and updates it. Returns the server's representation of the autoscalePolicy, and an error, if there is any.
func (c *FakeAutoscalePolicies) Update(autoscalePolicy *v1alpha1.AutoscalePolicy) (result *v1alpha1.AutoscalePolicy, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewUpdateAction(autoscalepoliciesResource, c.ns, autoscalePolicy), &v1alpha1.AutoscalePolicy{})

	if obj == nil {
		return nil, err
	}
	return obj.(*v1alpha1.AutoscalePolicy), err
}

// UpdateStatus was generated because the type contains a Status member.
// Add a +genclient:noStatus comment above the type to avoid generating UpdateStatus().
func (c *FakeAutoscalePolicies) UpdateStatus(autoscalePolicy *v1alpha1.AutoscalePolicy) (*v1alpha1.AutoscalePolicy, error) {
	obj, err := c.Fake.
		Invokes(testing.NewUpdateSubresourceAction(autoscalepoliciesResource, "status", c.ns, autoscalePolicy), &v1alpha1.AutoscalePolicy{})

	if obj == nil {
		return nil, err
	}
	return obj.(*v1alpha1.AutoscalePolicy), err
}

// Delete takes name of the autoscalePolicy and deletes it. Returns an error if one occurs.
func (c *FakeAutoscalePolicies) Delete(name string, options *v1.DeleteOptions) error {
	_, err := c.Fake.
		Invokes(testing.NewDeleteAction(autoscalepoliciesResource, c.ns, name), &v1alpha1.AutoscalePolicy{})

	return err
}

// DeleteCollection deletes a collection of objects.
func (c *FakeAutoscalePolicies) DeleteCollection(options *v1.DeleteOptions, listOptions v1.ListOptions) error {
	action := testing.NewDeleteCollectionAction(autoscalepoliciesResource, c.ns, listOptions)

	_, err := c.Fake.Invokes(action, &v1alpha1.AutoscalePolicyList{})
	return err
}

// Patch applies the patch and returns the patched autoscalePolicy.
func (c *FakeAutoscalePolicies) Patch(name string, pt types.PatchType, data []byte, subresources ...string) (result *v1alpha1.AutoscalePolicy, err error) {
	obj, err := c.Fake.
		Invokes(testing.NewPatchSubresourceAction(autoscalepoliciesResource, c.ns, name, pt, data, subresources...), &v1alpha1.AutoscalePolicy{})

	if obj == nil {
		return nil, err
	}
	return obj.(*v1alpha1.AutoscalePolicy), err
}