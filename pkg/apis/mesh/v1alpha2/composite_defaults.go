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

package v1alpha2

func (c *Composite) Default() {
	c.Spec.SetDefaults()
	c.Status.SetDefaults()
}

func (cs *CompositeSpec) SetDefaults() {
	for i, _ := range cs.Components {
		cs.Components[i].Spec.Default()
	}
}

func (cstat *CompositeStatus) SetDefaults() {
	if cstat.Status == "" {
		cstat.Status = CompositeCurrentStatusUnknown
	}
	if cstat.ComponentStatuses == nil {
		cstat.ComponentStatuses = make(map[string]ComponentCurrentStatus)
	}
	if cstat.ComponentGenerations == nil {
		cstat.ComponentGenerations = make(map[string]int64)
	}
}
